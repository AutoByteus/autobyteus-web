import { defineStore } from 'pinia';
import { getApolloClient } from '~/utils/apolloClient'
import { TerminateAgentTeamInstance, SendMessageToTeam } from '~/graphql/mutations/agentTeamInstanceMutations';
import type {
  SendMessageToTeamMutation,
  SendMessageToTeamMutationVariables,
  ContextFileType,
  TeamMemberConfigInput,
} from '~/generated/graphql';
import { useAgentTeamContextsStore } from '~/stores/agentTeamContextsStore';
import { useAgentActivityStore } from '~/stores/agentActivityStore';
import { useAgentTeamDefinitionStore } from '~/stores/agentTeamDefinitionStore';
import { TeamStreamingService } from '~/services/agentStreaming';
import { useWindowNodeContextStore } from '~/stores/windowNodeContextStore';
import { AgentStatus } from '~/types/agent/AgentStatus';
import { AgentTeamStatus } from '~/types/agent/AgentTeamStatus';

// Maintain a map of streaming services per team
const teamStreamingServices = new Map<string, TeamStreamingService>();

export const useAgentTeamRunStore = defineStore('agentTeamRun', {
  state: () => ({
    isLaunching: false,
  }),

  actions: {
    /**
     * Establish WebSocket connection for a team.
     */
    connectToTeamStream(teamId: string) {
      const teamContextsStore = useAgentTeamContextsStore();
      const teamContext = teamContextsStore.getTeamContextById(teamId);

      if (!teamContext) {
        console.warn(`Could not find team context for ID ${teamId} to connect stream.`);
        return;
      }

      const windowNodeContextStore = useWindowNodeContextStore();
      const wsEndpoint = windowNodeContextStore.getBoundEndpoints().teamWs;

      const service = new TeamStreamingService(wsEndpoint);
      teamStreamingServices.set(teamId, service);

      teamContext.isSubscribed = true;
      teamContext.unsubscribe = () => {
        service.disconnect();
        teamStreamingServices.delete(teamId);
      };

      service.connect(teamId, teamContext);
    },

    async terminateTeamInstance(teamId: string) {
      const teamContextsStore = useAgentTeamContextsStore();
      const teamContext = teamContextsStore.getTeamContextById(teamId);

      if (teamContext?.unsubscribe) {
        teamContext.unsubscribe();
        teamContext.unsubscribe = undefined;
      }
      teamStreamingServices.delete(teamId);

      if (teamContext) {
        teamContext.isSubscribed = false;
        teamContext.currentStatus = AgentTeamStatus.ShutdownComplete;
        teamContext.members.forEach((member) => {
          member.state.currentStatus = AgentStatus.ShutdownComplete;
          useAgentActivityStore().clearActivities(member.state.agentId);
        });
      }

      if (teamId.startsWith('temp-')) return;

      try {
        const client = getApolloClient()
        await client.mutate({
          mutation: TerminateAgentTeamInstance,
          variables: { id: teamId },
        });
      } catch (error) {
        console.error(`Error terminating team ${teamId} on backend:`, error);
      }
    },

    async terminateActiveTeam() {
      const activeTeam = useAgentTeamContextsStore().activeTeamContext;
      if (activeTeam) {
        await this.terminateTeamInstance(activeTeam.teamId);
      }
    },

    async sendMessageToFocusedMember(text: string, contextPaths: { path: string; type: string }[]) {
      const teamContextsStore = useAgentTeamContextsStore();
      const activeTeam = teamContextsStore.activeTeamContext;
      const focusedMember = teamContextsStore.focusedMemberContext;

      if (!focusedMember || !activeTeam) throw new Error('No active team context.');

      focusedMember.state.conversation.messages.push({
        type: 'user',
        text,
        timestamp: new Date(),
        contextFilePaths: contextPaths.map(p => ({ path: p.path, type: p.type as any }))
      });
      focusedMember.state.conversation.updatedAt = new Date().toISOString();

      const isTemporary = activeTeam.teamId.startsWith('temp-');

      try {
        const client = getApolloClient()
        let variables: SendMessageToTeamMutationVariables;

        if (isTemporary) {
          this.isLaunching = true;

          const teamDefinitionStore = useAgentTeamDefinitionStore();
          const teamDef = teamDefinitionStore.getAgentTeamDefinitionById(activeTeam.config.teamDefinitionId);
          if (!teamDef) throw new Error(`Team definition ${activeTeam.config.teamDefinitionId} not found.`);

          const memberConfigs: TeamMemberConfigInput[] = teamDef.nodes
            .filter(node => node.referenceType === 'AGENT')
            .map((node) => {
              const override = activeTeam.config.memberOverrides[node.memberName];
              return {
                memberName: node.memberName,
                agentDefinitionId: node.referenceId,
                llmModelIdentifier: override?.llmModelIdentifier || activeTeam.config.llmModelIdentifier,
                workspaceId: activeTeam.config.workspaceId,
                autoExecuteTools: override?.autoExecuteTools ?? activeTeam.config.autoExecuteTools,
                llmConfig: override?.llmConfig ?? null,
              };
            });

          variables = {
            input: {
              userInput: {
                content: text,
                contextFiles: contextPaths.map(cf => ({
                  path: cf.path,
                  type: cf.type.toUpperCase() as ContextFileType
                })),
              },
              teamId: null,
              targetMemberName: activeTeam.focusedMemberName,
              teamDefinitionId: activeTeam.config.teamDefinitionId,
              memberConfigs,
            }
          };
        } else {
          variables = {
            input: {
              userInput: {
                content: text,
                contextFiles: contextPaths.map(cf => ({
                  path: cf.path,
                  type: cf.type.toUpperCase() as ContextFileType
                })),
              },
              teamId: activeTeam.teamId,
              targetMemberName: activeTeam.focusedMemberName,
            }
          };
        }

        const { data, errors } = await client.mutate<SendMessageToTeamMutation, SendMessageToTeamMutationVariables>({
          mutation: SendMessageToTeam,
          variables,
        });

        if (errors && errors.length > 0) {
          throw new Error(errors.map(e => e.message).join(', '));
        }

        const permanentId = data?.sendMessageToTeam?.teamId;
        if (!data?.sendMessageToTeam?.success || !permanentId) {
          throw new Error(data?.sendMessageToTeam?.message || 'Failed to send message.');
        }

        if (isTemporary) {
          teamContextsStore.promoteTemporaryTeamId(activeTeam.teamId, permanentId);
          teamContextsStore.lockConfig(permanentId);
          this.connectToTeamStream(permanentId);
        }
      } catch (error: any) {
        console.error(`Failed to send message to member ${focusedMember.state.agentId}:`, error);
        throw new Error(`Failed to send message: ${error.message}`);
      } finally {
        if (isTemporary) {
          this.isLaunching = false;
        }
      }
    },

    /**
     * Sends tool approval/denial to the active team stream.
     */
    async postToolExecutionApproval(invocationId: string, isApproved: boolean, reason: string | null = null) {
      const teamContextsStore = useAgentTeamContextsStore();
      const activeTeam = teamContextsStore.activeTeamContext;
      const focusedMember = teamContextsStore.focusedMemberContext;

      if (!activeTeam || !focusedMember) {
        console.warn('No active team or focused member for tool approval.');
        return;
      }

      const service = teamStreamingServices.get(activeTeam.teamId);
      const agentName = activeTeam.focusedMemberName || focusedMember.state.agentId;

      if (service) {
        if (isApproved) {
          service.approveTool(invocationId, agentName, reason || undefined);
        } else {
          service.denyTool(invocationId, agentName, reason || undefined);
        }
      }

    },
  },
});
