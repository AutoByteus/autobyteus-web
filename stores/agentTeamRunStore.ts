import { defineStore } from 'pinia';
import { useMutation, useSubscription } from '@vue/apollo-composable';
import { TerminateAgentTeamInstance, SendMessageToTeam } from '~/graphql/mutations/agentTeamInstanceMutations';
import { AgentTeamResponseSubscription } from '~/graphql/subscriptions/agentTeamResponseSubscription';
import type {
  SendMessageToTeamMutation,
  SendMessageToTeamMutationVariables,
  AgentTeamResponseSubscription as AgentTeamResponseSubscriptionType,
  AgentTeamResponseSubscriptionVariables,
  ContextFileType,
  TeamMemberConfigInput,
} from '~/generated/graphql';
import { useAgentTeamContextsStore } from '~/stores/agentTeamContextsStore';
import { processAgentTeamResponseEvent } from '~/services/agentTeamResponseProcessor';
import { useWorkspaceStore } from '~/stores/workspace';
import type { TeamLaunchProfile, WorkspaceLaunchConfig } from '~/types/TeamLaunchProfile';

export const useAgentTeamRunStore = defineStore('agentTeamRun', {
  state: () => ({
    isLaunching: false,
  }),

  actions: {
    subscribeToTeamResponse(teamId: string) {
      const teamContextsStore = useAgentTeamContextsStore();
      const { onResult, onError, stop } = useSubscription<AgentTeamResponseSubscriptionType, AgentTeamResponseSubscriptionVariables>(
        AgentTeamResponseSubscription, { teamId: teamId }
      );
      
      const teamContext = teamContextsStore.getTeamContextById(teamId);
      if (teamContext) {
          teamContext.isSubscribed = true;
          teamContext.unsubscribe = stop;
      } else {
        console.warn(`Could not find team context for ID ${teamId} immediately after creation to attach subscription.`);
      }

      onResult(({ data }) => {
        if (data?.agentTeamResponse) {
          processAgentTeamResponseEvent(data.agentTeamResponse);
        }
      });

      onError((error) => {
        console.error(`Subscription error for team ${teamId}:`, error);
        stop();
        const teamContextOnError = teamContextsStore.getTeamContextById(teamId);
        if (teamContextOnError) {
            teamContextOnError.isSubscribed = false;
        }
      });
    },

    async terminateTeamInstance(teamId: string) {
      const teamContextsStore = useAgentTeamContextsStore();
      teamContextsStore.removeTeamContext(teamId);
      
      // Do not try to terminate a temporary instance on the backend
      if (teamId.startsWith('temp-')) {
        return;
      }

      try {
        const { mutate: terminateTeam } = useMutation(TerminateAgentTeamInstance);
        await terminateTeam({ id: teamId });
        console.log(`Terminated team ${teamId} successfully.`);
      } catch (error) {
        console.error(`Error terminating team ${teamId} on backend:`, error);
      }
    },
    
    async terminateActiveTeam() {
      const teamContextsStore = useAgentTeamContextsStore();
      const activeTeam = teamContextsStore.activeTeamContext;
      if (activeTeam) {
        await this.terminateTeamInstance(activeTeam.teamId);
      }
    },

    async sendMessageToFocusedMember(text: string, contextPaths: { path: string, type: string }[]) {
      const teamContextsStore = useAgentTeamContextsStore();
      const focusedMember = teamContextsStore.focusedMemberContext;
      const activeTeam = teamContextsStore.activeTeamContext;

      if (!focusedMember || !activeTeam) {
        throw new Error("No focused team member or active team to send message to.");
      }

      // Add user message to local conversation immediately
      focusedMember.state.conversation.messages.push({
        type: 'user',
        text: text,
        timestamp: new Date(),
        contextFilePaths: contextPaths.map(p => ({path: p.path, type: p.type as any}))
      });

      const { mutate: sendMessage } = useMutation<SendMessageToTeamMutation, SendMessageToTeamMutationVariables>(SendMessageToTeam);
      
      const isTemporary = activeTeam.teamId.startsWith('temp-');
      
      try {
        let variables: SendMessageToTeamMutationVariables;

        if (isTemporary) {
          this.isLaunching = true;
          const profile = activeTeam.launchProfile;
          const memberConfigs = await this._resolveMemberConfigs(profile);
          
          variables = {
            input: {
              userInput: {
                content: text,
                contextFiles: contextPaths.map(cf => ({ path: cf.path, type: cf.type.toUpperCase() as ContextFileType })),
              },
              teamId: null,
              targetNodeName: focusedMember.state.agentId,
              teamDefinitionId: profile.teamDefinition.id,
              memberConfigs: memberConfigs,
            }
          };
        } else {
          variables = {
            input: {
              userInput: {
                content: text,
                contextFiles: contextPaths.map(cf => ({ path: cf.path, type: cf.type.toUpperCase() as ContextFileType })),
              },
              teamId: activeTeam.teamId,
              targetNodeName: focusedMember.state.agentId,
            }
          };
        }

        const result = await sendMessage(variables);
        const permanentId = result?.data?.sendMessageToTeam?.teamId;

        if (!result?.data?.sendMessageToTeam?.success || !permanentId) {
          throw new Error(result?.data?.sendMessageToTeam?.message || 'Failed to send message to team.');
        }

        if (isTemporary) {
          teamContextsStore.promoteTemporaryTeamId(activeTeam.teamId, permanentId);
          this.subscribeToTeamResponse(permanentId);
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
    
    // --- Private Helper Methods ---

    async _resolveMemberConfigs(profile: TeamLaunchProfile): Promise<TeamMemberConfigInput[]> {
      const globalWorkspaceId = await this._resolveWorkspaceId(profile.globalConfig.workspaceConfig, "Team Default");
      const agentNodes = profile.teamDefinition.nodes.filter(n => n.referenceType === 'AGENT');
      
      const memberConfigs: TeamMemberConfigInput[] = await Promise.all(
        agentNodes.map(async (memberNode) => {
          const override = profile.memberOverrides.find(ov => ov.memberName === memberNode.memberName);
          const effectiveWsConfig = override?.workspaceConfig || profile.globalConfig.workspaceConfig;
          
          let finalWorkspaceId: string | null;
          if (override?.workspaceConfig) {
            finalWorkspaceId = await this._resolveWorkspaceId(effectiveWsConfig, memberNode.memberName);
          } else {
            finalWorkspaceId = globalWorkspaceId;
          }

          return {
            memberName: memberNode.memberName,
            llmModelName: override?.llmModelName || profile.globalConfig.llmModelName,
            workspaceId: finalWorkspaceId,
            autoExecuteTools: override?.autoExecuteTools ?? profile.globalConfig.autoExecuteTools,
          };
        })
      );
      return memberConfigs;
    },

    async _resolveWorkspaceId(config: WorkspaceLaunchConfig, forItemName: string): Promise<string | null> {
      const workspaceStore = useWorkspaceStore();
      if (config.mode === 'none') return null;
      if (config.mode === 'existing') return config.existingWorkspaceId || null;
      if (config.mode === 'new' && config.newWorkspaceConfig) {
        if (!config.newWorkspaceConfig.typeName) {
          throw new Error(`Workspace type for "${forItemName}" is not selected.`);
        }
        try {
          return await workspaceStore.createWorkspace(config.newWorkspaceConfig.typeName, config.newWorkspaceConfig.params);
        } catch (e: any) {
          console.error(`Failed to create workspace for ${forItemName}:`, e);
          throw new Error(`Failed to create workspace for "${forItemName}": ${e.message}`);
        }
      }
      return null;
    },
  },
});
