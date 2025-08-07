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
  AgentOperationalPhase,
} from '~/generated/graphql';
import { useAgentTeamContextsStore } from '~/stores/agentTeamContextsStore';
import { processAgentTeamResponseEvent } from '~/services/agentTeamResponseProcessor';
import { useWorkspaceStore } from '~/stores/workspace';
import type { TeamLaunchProfile, WorkspaceLaunchConfig, TeamMemberConfigOverride } from '~/types/TeamLaunchProfile';
import { AgentContext } from '~/types/agent/AgentContext';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation } from '~/types/conversation';
import type { AgentTeamContext } from '~/types/agent/AgentTeamContext';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';
import { useAgentTeamLaunchProfileStore } from '~/stores/agentTeamLaunchProfileStore';
import type { AgentTeamDefinition } from './agentTeamDefinitionStore';

export const useAgentTeamRunStore = defineStore('agentTeamRun', {
  state: () => ({
    isLaunching: false,
  }),

  actions: {
    /**
     * @action activateTeamProfile
     * @description The primary entry point for launching a team. It resolves the environment
     * (workspaces), stores it as a session, and creates the first instance.
     */
    async activateTeamProfile(profile: TeamLaunchProfile) {
      this.isLaunching = true;
      try {
        const teamContextsStore = useAgentTeamContextsStore();
        
        // Step 1: Resolve all workspace IDs by creating new ones where necessary.
        const resolvedMemberConfigs = await this._resolveMemberConfigs(profile);

        // Step 2: Store this resolved configuration as the active resolved profile.
        teamContextsStore.setActiveResolvedProfile({
          profileId: profile.id,
          resolvedMemberConfigs: resolvedMemberConfigs,
        });

        // Step 3: Create the first UI instance for this new session.
        await this.createNewTeamInstance();

      } catch(error: any) {
        console.error("Failed to activate team profile:", error);
        alert(`Failed to activate team profile: ${error.message}`);
        // Clear session on failure
        useAgentTeamContextsStore().setActiveResolvedProfile(null);
      } finally {
        this.isLaunching = false;
      }
    },

    /**
     * @action createNewTeamInstance
     * @description Creates a new UI instance (tab) for the *currently active* resolved profile.
     * This function is now simple and stateless.
     */
    async createNewTeamInstance() {
      const teamContextsStore = useAgentTeamContextsStore();
      const activeResolvedProfile = teamContextsStore.activeResolvedProfile;
      const teamProfileStore = useAgentTeamLaunchProfileStore();

      if (!activeResolvedProfile) {
        throw new Error("Cannot create team instance: No active resolved profile found.");
      }
      const profile = teamProfileStore.profiles[activeResolvedProfile.profileId];
      if (!profile) {
        throw new Error(`Cannot create instance: Profile with ID ${activeResolvedProfile.profileId} not found.`);
      }

      const tempId = `temp-team-${Date.now()}`;
      const members = new Map<string, AgentContext>();

      for (const configForMember of activeResolvedProfile.resolvedMemberConfigs) {
        const conversation: Conversation = {
          id: `${tempId}::${configForMember.memberName}`,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const agentState = new AgentRunState(configForMember.memberName, conversation);
        const agentConfig: AgentRunConfig = {
          launchProfileId: profile.id,
          workspaceId: configForMember.workspaceId,
          llmModelIdentifier: configForMember.llmModelIdentifier,
          autoExecuteTools: configForMember.autoExecuteTools,
          parseToolCalls: true,
        };
        
        const agentContext = new AgentContext(agentConfig, agentState);
        members.set(configForMember.memberName, agentContext);
      }
      
      const newTeamContext: AgentTeamContext = {
        teamId: tempId,
        launchProfile: profile,
        members: members,
        focusedMemberName: profile.teamDefinition.coordinatorMemberName,
        currentPhase: 'UNINITIALIZED' as AgentOperationalPhase,
        isSubscribed: false,
        unsubscribe: undefined,
      };
      
      teamContextsStore.addTeamContext(newTeamContext);
    },

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
        console.warn(`Could not find team context for ID ${teamId} to attach subscription.`);
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
      
      if (teamId.startsWith('temp-')) return;

      try {
        const { mutate: terminateTeam } = useMutation(TerminateAgentTeamInstance);
        await terminateTeam({ id: teamId });
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

    async sendMessageToFocusedMember(text: string, contextPaths: { path: string, type: string }[]) {
      const teamContextsStore = useAgentTeamContextsStore();
      const focusedMember = teamContextsStore.focusedMemberContext;
      const activeTeam = teamContextsStore.activeTeamContext;

      if (!focusedMember || !activeTeam) throw new Error("No active context.");

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
          const memberConfigs = teamContextsStore.activeResolvedProfile?.resolvedMemberConfigs;
          if (!memberConfigs) throw new Error("Active resolved profile with configs not found for launch.");
          
          variables = {
            input: {
              userInput: { content: text, contextFiles: contextPaths.map(cf => ({ path: cf.path, type: cf.type.toUpperCase() as ContextFileType })) },
              teamId: null,
              targetNodeName: focusedMember.state.agentId,
              teamDefinitionId: activeTeam.launchProfile.teamDefinition.id,
              memberConfigs: memberConfigs,
            }
          };
        } else {
          variables = {
            input: {
              userInput: { content: text, contextFiles: contextPaths.map(cf => ({ path: cf.path, type: cf.type.toUpperCase() as ContextFileType })) },
              teamId: activeTeam.teamId,
              targetNodeName: focusedMember.state.agentId,
            }
          };
        }

        const result = await sendMessage(variables);
        const permanentId = result?.data?.sendMessageToTeam?.teamId;

        if (!result?.data?.sendMessageToTeam?.success || !permanentId) {
          throw new Error(result?.data?.sendMessageToTeam?.message || 'Failed to send message.');
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
    
    async _resolveMemberConfigs(profile: TeamLaunchProfile): Promise<TeamMemberConfigInput[]> {
      const globalWorkspaceId = await this._resolveWorkspaceId(profile.globalConfig.workspaceConfig, "Team Default");
      const agentNodes = profile.teamDefinition.nodes.filter(n => n.referenceType === 'AGENT');
      
      return Promise.all(
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
            llmModelIdentifier: override?.llmModelIdentifier || profile.globalConfig.llmModelIdentifier,
            workspaceId: finalWorkspaceId,
            autoExecuteTools: override?.autoExecuteTools ?? profile.globalConfig.autoExecuteTools,
          };
        })
      );
    },

    async _resolveWorkspaceId(config: WorkspaceLaunchConfig, forItemName: string): Promise<string | null> {
      const workspaceStore = useWorkspaceStore();
      if (config.mode === 'none') return null;
      if (config.mode === 'existing') return config.existingWorkspaceId || null;
      if (config.mode === 'new' && config.newWorkspaceConfig) {
        if (!config.newWorkspaceConfig.typeName) throw new Error(`Workspace type for "${forItemName}" not selected.`);
        try {
          return await workspaceStore.createWorkspace(config.newWorkspaceConfig.typeName, config.newWorkspaceConfig.params);
        } catch (e: any) {
          throw new Error(`Failed to create workspace for "${forItemName}": ${e.message}`);
        }
      }
      return null;
    },
  },
});
