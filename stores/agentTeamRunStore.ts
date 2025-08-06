import { defineStore } from 'pinia';
import { useMutation, useSubscription } from '@vue/apollo-composable';
import { CreateAgentTeamInstance, TerminateAgentTeamInstance, SendMessageToTeam } from '~/graphql/mutations/agentTeamInstanceMutations';
import { AgentTeamResponseSubscription } from '~/graphql/subscriptions/agentTeamResponseSubscription';
import type {
  CreateAgentTeamInstanceMutation,
  CreateAgentTeamInstanceMutationVariables,
  AgentTeamResponseSubscription as AgentTeamResponseSubscriptionType,
  AgentTeamResponseSubscriptionVariables,
  SendMessageToTeamMutation,
  SendMessageToTeamMutationVariables,
  ContextFileType,
  TeamMemberConfigInput,
} from '~/generated/graphql';
import { useAgentTeamContextsStore } from '~/stores/agentTeamContextsStore';
import { useAgentTeamLaunchProfileStore } from '~/stores/agentTeamLaunchProfileStore';
import { processAgentTeamResponseEvent } from '~/services/agentTeamResponseProcessor';
import { useWorkspaceStore } from '~/stores/workspace';
import type { TeamLaunchProfile, WorkspaceLaunchConfig } from '~/types/TeamLaunchProfile';
import { AgentContext } from '~/types/agent/AgentContext';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation } from '~/types/conversation';
import type { AgentTeamContext } from '~/types/agent/AgentTeamContext';

export const useAgentTeamRunStore = defineStore('agentTeamRun', {
  state: () => ({
    isLaunching: false,
  }),

  actions: {
    /**
     * @action launchNewInstanceFromProfile
     * @description The core logic for launching a team instance from a saved profile.
     * It resolves workspaces, calls the backend, and sets up the new context.
     */
    async launchNewInstanceFromProfile(profile: TeamLaunchProfile): Promise<{ success: boolean; teamId: string | null; message: string }> {
      this.isLaunching = true;
      const teamContextsStore = useAgentTeamContextsStore();
      const teamLaunchProfileStore = useAgentTeamLaunchProfileStore();
      const { mutate: createTeam } = useMutation<CreateAgentTeamInstanceMutation, CreateAgentTeamInstanceMutationVariables>(CreateAgentTeamInstance);

      try {
        // CRITICAL FIX: Set the profile as active BEFORE trying to add context to it.
        // Since the profile passed in is now a real, persistent one, this will work.
        teamLaunchProfileStore.setActiveLaunchProfile(profile.id);

        // Resolve workspaces and build member configs
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
        
        // Call mutation
        const result = await createTeam({
          input: { teamDefinitionId: profile.teamDefinition.id, memberConfigs: memberConfigs }
        });

        const teamId = result?.data?.createAgentTeamInstance?.teamId;
        if (!result?.data?.createAgentTeamInstance?.success || !teamId) {
          throw new Error(result?.data?.createAgentTeamInstance?.message || 'Failed to create team instance.');
        }
        
        // Create and add context
        const newTeamContext = this._createTeamContext(profile, teamId, memberConfigs);
        teamContextsStore.addTeamContext(newTeamContext);

        // Subscribe
        this.subscribeToTeamResponse(teamId);
        
        return { success: true, teamId: teamId, message: 'Team instance launched successfully.' };
      } catch (error: any) {
        console.error("Error launching new team instance:", error);
        return { success: false, teamId: null, message: error.message || "An unexpected error occurred." };
      } finally {
        this.isLaunching = false;
      }
    },

    subscribeToTeamResponse(teamId: string) {
      const teamContextsStore = useAgentTeamContextsStore();
      const { onResult, onError, stop } = useSubscription<AgentTeamResponseSubscriptionType, AgentTeamResponseSubscriptionVariables>(
        AgentTeamResponseSubscription, { teamId: teamId }
      );
      
      // The context might not be added yet, so we find it across all profiles
      // This is a bit of a workaround for reactivity timing
      for (const profileState of teamContextsStore.teamsByLaunchProfile.values()) {
        const teamContext = profileState.activeTeams.get(teamId);
        if (teamContext) {
          teamContext.isSubscribed = true;
          teamContext.unsubscribe = stop;
          break;
        }
      }

      onResult(({ data }) => {
        if (data?.agentTeamResponse) {
          processAgentTeamResponseEvent(data.agentTeamResponse);
        }
      });

      onError((error) => {
        console.error(`Subscription error for team ${teamId}:`, error);
        stop();
        // Future: Could add logic to find the context again and update its state
      });
    },

    async terminateTeamInstance(teamId: string) {
      const teamContextsStore = useAgentTeamContextsStore();
      teamContextsStore.removeTeamContext(teamId);
      
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
        throw new Error("No focused team member to send message to.");
      }

      focusedMember.state.conversation.messages.push({
        type: 'user',
        text: text,
        timestamp: new Date(),
        contextFilePaths: contextPaths.map(p => ({path: p.path, type: p.type as any}))
      });

      const { mutate: sendMessage } = useMutation<SendMessageToTeamMutation, SendMessageToTeamMutationVariables>(SendMessageToTeam);

      try {
        await sendMessage({
          input: {
            teamId: activeTeam.teamId,
            targetNodeName: focusedMember.state.agentId,
            userInput: {
              content: text,
              contextFiles: contextPaths.map(cf => ({ path: cf.path, type: cf.type.toUpperCase() as ContextFileType })),
            }
          }
        });
      } catch (error: any) {
        console.error(`Failed to send message to member ${focusedMember.state.agentId}:`, error);
        throw new Error(`Failed to send message: ${error.message}`);
      }
    },

    // --- Private Helper Methods ---

    /**
     * @description Resolves a WorkspaceLaunchConfig into a workspace ID, creating one if necessary.
     */
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

    /**
     * @description Creates a full AgentTeamContext object from a launch profile and resolved configs.
     */
    _createTeamContext(launchProfile: TeamLaunchProfile, teamId: string, resolvedMemberConfigs: TeamMemberConfigInput[]): AgentTeamContext {
      const members = new Map<string, AgentContext>();
      const agentNodes = launchProfile.teamDefinition.nodes.filter(n => n.referenceType === 'AGENT');
      
      for (const memberNode of agentNodes) {
        const memberConfig = resolvedMemberConfigs.find(c => c.memberName === memberNode.memberName);
        if (!memberConfig) continue;

        const conversation: Conversation = {
          id: `${teamId}::${memberNode.memberName}`,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        const agentState = new AgentRunState(memberConfig.memberName, conversation);
        const agentContext = new AgentContext(
          {
            launchProfileId: launchProfile.id,
            workspaceId: memberConfig.workspaceId,
            llmModelName: memberConfig.llmModelName,
            autoExecuteTools: memberConfig.autoExecuteTools,
            parseToolCalls: true,
          },
          agentState
        );
        members.set(memberNode.memberName, agentContext);
      }
      
      return {
        teamId: teamId,
        launchProfile: launchProfile,
        members: members,
        focusedMemberName: launchProfile.teamDefinition.coordinatorMemberName,
        currentPhase: 'BOOTSTRAPPING',
        isSubscribed: false,
        unsubscribe: undefined,
      };
    },
  },
});
