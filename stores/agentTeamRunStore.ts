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
import { useSelectedLaunchProfileStore } from '~/stores/selectedLaunchProfileStore';
import { useAgentTeamLaunchProfileStore } from '~/stores/agentTeamLaunchProfileStore';
import { processAgentTeamResponseEvent } from '~/services/agentTeamResponseProcessor';
import type { TeamLaunchProfile } from '~/types/TeamLaunchProfile';

export const useAgentTeamRunStore = defineStore('agentTeamRun', {
  state: () => ({
    // This store is for orchestration, not for long-term state.
    isLaunching: false,
  }),

  actions: {
    async launchTeamAndSubscribe(
      teamDefinitionId: string,
      memberConfigs: TeamMemberConfigInput[]
    ): Promise<{ success: boolean; teamId: string | null; message: string }> {
      this.isLaunching = true;
      const teamContextsStore = useAgentTeamContextsStore();
      const teamProfileStore = useAgentTeamLaunchProfileStore();
      const { mutate: createTeam } = useMutation<CreateAgentTeamInstanceMutation, CreateAgentTeamInstanceMutationVariables>(CreateAgentTeamInstance);

      try {
        const result = await createTeam({
          input: { teamDefinitionId: teamDefinitionId, memberConfigs: memberConfigs }
        });

        const teamId = result?.data?.createAgentTeamInstance?.teamId;
        if (!result?.data?.createAgentTeamInstance?.success || !teamId) {
          throw new Error(result?.data?.createAgentTeamInstance?.message || 'Failed to create team instance.');
        }
        
        // Find the team definition.
        // This logic seems a bit complex, might need review later, but for now we make it work with the refactor.
        let teamDef = teamProfileStore.allLaunchProfiles.find(p => p.teamDefinition.id === teamDefinitionId)?.teamDefinition;
        if (!teamDef) {
          const { useAgentTeamDefinitionStore } = await import('~/stores/agentTeamDefinitionStore');
          const teamDefStore = useAgentTeamDefinitionStore();
          teamDef = teamDefStore.getAgentTeamDefinitionById(teamDefinitionId);
          if (!teamDef) {
            throw new Error("Could not find team definition for the new profile.");
          }
        }
        
        // Create the launch profile using the refactored action name.
        const launchProfile = teamProfileStore.createLaunchProfile(teamDef, {
            globalLlmModelName: '', // These are placeholders, ideally they come from the form
            globalWorkspaceId: null,
            memberConfigs: memberConfigs,
        });

        teamContextsStore.setActiveTeamContext(launchProfile, teamId);
        this.subscribeToTeamResponse(teamId);
        
        // Use the new, consistent action to set the active profile.
        teamProfileStore.setActiveLaunchProfile(launchProfile.id);
        
        return { success: true, teamId: teamId, message: 'Team launched successfully.' };
      } catch (error: any) {
        console.error("Error launching team:", error);
        return { success: false, teamId: null, message: error.message || "An unexpected error occurred." };
      } finally {
        this.isLaunching = false;
      }
    },

    subscribeToTeamResponse(teamId: string) {
      const teamContextsStore = useAgentTeamContextsStore();
      const teamContext = teamContextsStore.activeTeamContext;
      if (!teamContext || teamContext.teamId !== teamId) {
        console.error("Cannot subscribe: No active team context or mismatched ID.");
        return;
      }
      
      if (teamContext.isSubscribed) return;

      const { onResult, onError, stop } = useSubscription<AgentTeamResponseSubscriptionType, AgentTeamResponseSubscriptionVariables>(
        AgentTeamResponseSubscription, { teamId: teamId }
      );
      
      teamContext.isSubscribed = true;
      teamContext.unsubscribe = stop;

      onResult(({ data }) => {
        if (data?.agentTeamResponse) {
          processAgentTeamResponseEvent(data.agentTeamResponse);
        }
      });

      onError((error) => {
        console.error(`Subscription error for team ${teamId}:`, error);
        stop();
        if (teamContextsStore.activeTeamContext?.teamId === teamId) {
            teamContextsStore.activeTeamContext.isSubscribed = false;
            teamContextsStore.activeTeamContext.unsubscribe = undefined;
        }
      });
    },

    async terminateActiveTeam() {
      const teamContextsStore = useAgentTeamContextsStore();
      const activeTeam = teamContextsStore.activeTeamContext;
      if (!activeTeam) return;

      const teamId = activeTeam.teamId;
      teamContextsStore.clearActiveTeamContext(); // Clears UI state immediately
      
      try {
        const { mutate: terminateTeam } = useMutation(TerminateAgentTeamInstance);
        await terminateTeam({ id: teamId });
        console.log(`Terminated team ${teamId} successfully.`);
      } catch (error) {
        console.error(`Error terminating team ${teamId} on backend:`, error);
        // The UI state is already cleared, so we just log the error.
      }
    },

    async sendMessageToFocusedMember(text: string, contextPaths: { path: string, type: string }[]) {
      const teamContextsStore = useAgentTeamContextsStore();
      const focusedMember = teamContextsStore.focusedMemberContext;
      const activeTeam = teamContextsStore.activeTeamContext;

      if (!focusedMember || !activeTeam) {
        throw new Error("No focused team member to send message to.");
      }

      // Add user message to the focused member's local conversation
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
            targetNodeName: focusedMember.state.agentId, // agentId here is the member name
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
  },
});
