import { defineStore } from 'pinia';
import { useMutation, useSubscription } from '@vue/apollo-composable';
import { v4 as uuidv4 } from 'uuid';
import { useApplicationContextStore } from './applicationContextStore';
import { processAgentTeamResponseEvent } from '~/services/agentTeamResponseProcessor';
import { SendMessageToTeam } from '~/graphql/mutations/agentTeamInstanceMutations';
import { AgentTeamResponseSubscription } from '~/graphql/subscriptions/agentTeamResponseSubscription';
import type { ApplicationLaunchConfig, ApplicationRunContext } from '~/types/application/ApplicationRun';
import type { AgentTeamDefinition } from '~/stores/agentTeamDefinitionStore';
import type { AgentTeamContext } from '~/types/agent/AgentTeamContext';
import { AgentContext } from '~/types/agent/AgentContext';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';
import type { Conversation } from '~/types/conversation';
import type {
  TeamMemberConfigInput,
  AgentOperationalPhase,
  SendMessageToTeamMutation,
  SendMessageToTeamMutationVariables,
  AgentTeamResponseSubscription as AgentTeamResponseSubscriptionType,
  AgentTeamResponseSubscriptionVariables,
  ContextFileType,
  TaskNotificationModeEnum,
} from '~/generated/graphql';


function _resolveApplicationMemberConfigs(
  teamDefinition: AgentTeamDefinition,
  agentLlmConfig: Record<string, string>
): TeamMemberConfigInput[] {
  return teamDefinition.nodes
    .filter(n => n.referenceType === 'AGENT')
    .map(memberNode => ({
      memberName: memberNode.memberName,
      llmModelIdentifier: agentLlmConfig[memberNode.memberName],
      workspaceId: null,
      autoExecuteTools: true,
    }));
}

export const useApplicationRunStore = defineStore('applicationRun', {
  state: () => ({
    isLaunching: false,
  }),
  actions: {
    async launchApplication(launchConfig: ApplicationLaunchConfig): Promise<string> {
      this.isLaunching = true;
      try {
        const appContextStore = useApplicationContextStore();
        const instanceId = uuidv4();
        const tempTeamId = `temp-app-team-${Date.now()}`;

        const ephemeralProfile = {
          id: `ephemeral-profile-${instanceId}`,
          name: `${launchConfig.teamDefinition.name} (Application Run)`,
          createdAt: new Date().toISOString(),
          teamDefinition: launchConfig.teamDefinition,
          globalConfig: {
            workspaceConfig: { mode: 'none' as const },
            llmModelIdentifier: '',
            autoExecuteTools: true,
            useXmlToolFormat: true, // Set to true by default as requested
            taskNotificationMode: 'FULL' as const,
          },
          memberOverrides: [],
        };

        const members = new Map<string, AgentContext>();
        for (const agentNode of launchConfig.teamDefinition.nodes.filter(n => n.referenceType === 'AGENT')) {
          const memberName = agentNode.memberName;
          const conversation: Conversation = {
            id: `${tempTeamId}::${memberName}`,
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            agentDefinitionId: agentNode.referenceId,
          };
          const agentState = new AgentRunState(memberName, conversation);
          const agentConfig: AgentRunConfig = {
            launchProfileId: ephemeralProfile.id,
            workspaceId: null,
            llmModelIdentifier: launchConfig.agentLlmConfig[memberName],
            autoExecuteTools: true,
            parseToolCalls: true,
            useXmlToolFormat: ephemeralProfile.globalConfig.useXmlToolFormat,
          };
          members.set(memberName, new AgentContext(agentConfig, agentState));
        }
        
        const teamContext: AgentTeamContext = {
          teamId: tempTeamId,
          launchProfile: ephemeralProfile,
          members: members,
          focusedMemberName: launchConfig.teamDefinition.coordinatorMemberName,
          currentPhase: 'UNINITIALIZED' as AgentOperationalPhase,
          isSubscribed: false,
          unsubscribe: undefined,
          taskPlan: null,
          taskStatuses: null,
        };
        
        const runContext: ApplicationRunContext = {
          instanceId,
          appId: launchConfig.appId,
          teamContext,
        };

        appContextStore.addRun(runContext);
        appContextStore.setActiveRun(instanceId);
        
        return instanceId;
      } finally {
        this.isLaunching = false;
      }
    },

    async sendMessageToApplication(instanceId: string, text: string, contextPaths: { path: string, type: string }[]) {
      const appContextStore = useApplicationContextStore();
      const runContext = appContextStore.getRun(instanceId);
      if (!runContext) throw new Error(`Application run with ID ${instanceId} not found.`);

      const { teamContext } = runContext;
      const focusedMember = teamContext.members.get(teamContext.focusedMemberName);
      if (!focusedMember) throw new Error("Focused member not found in application context.");

      focusedMember.state.conversation.messages.push({
        type: 'user',
        text: text,
        timestamp: new Date(),
        contextFilePaths: contextPaths.map(p => ({path: p.path, type: p.type as any}))
      });

      const { mutate: sendMessage } = useMutation<SendMessageToTeamMutation, SendMessageToTeamMutationVariables>(SendMessageToTeam);
      const isTemporary = teamContext.teamId.startsWith('temp-');

      try {
        const agentLlmConfig = Array.from(teamContext.members.values()).reduce((acc, member) => {
            acc[member.state.agentId] = member.config.llmModelIdentifier;
            return acc;
        }, {} as Record<string, string>);
        
        // **THE FIX IS HERE**: The helper function _resolveApplicationMemberConfigs already creates the correct structure for the API.
        // The error you saw on the LAUNCH screen is because that screen uses a DIFFERENT mutation (CreateAgentTeamInstance)
        // and is building its memberConfig payload incorrectly.
        // This code here for lazy creation is now correct and safe.
        const memberConfigsForApi = isTemporary 
          ? _resolveApplicationMemberConfigs(teamContext.launchProfile.teamDefinition, agentLlmConfig) 
          : undefined;

        const variables: SendMessageToTeamMutationVariables = {
          input: {
            userInput: { content: text, contextFiles: contextPaths.map(cf => ({ path: cf.path, type: cf.type.toUpperCase() as ContextFileType })) },
            teamId: isTemporary ? null : teamContext.teamId,
            targetNodeName: focusedMember.state.agentId,
            teamDefinitionId: isTemporary ? teamContext.launchProfile.teamDefinition.id : undefined,
            memberConfigs: memberConfigsForApi,
            taskNotificationMode: isTemporary ? teamContext.launchProfile.globalConfig.taskNotificationMode as TaskNotificationModeEnum : undefined,
            useXmlToolFormat: isTemporary ? teamContext.launchProfile.globalConfig.useXmlToolFormat : undefined,
          }
        };

        const result = await sendMessage(variables);
        const permanentId = result?.data?.sendMessageToTeam?.teamId;

        if (!result?.data?.sendMessageToTeam?.success || !permanentId) {
          throw new Error(result?.data?.sendMessageToTeam?.message || 'Failed to send message.');
        }

        if (isTemporary) {
          appContextStore.promoteTemporaryTeamId(instanceId, permanentId);
          this.subscribeToApplication(instanceId);
        }
      } catch (error: any) {
        throw new Error(`Failed to send message: ${error.message}`);
      }
    },

    subscribeToApplication(instanceId: string) {
      const appContextStore = useApplicationContextStore();
      const runContext = appContextStore.getRun(instanceId);
      if (!runContext || runContext.teamContext.isSubscribed) return;

      const { teamContext } = runContext;

      const { onResult, onError, stop } = useSubscription<AgentTeamResponseSubscriptionType, AgentTeamResponseSubscriptionVariables>(
        AgentTeamResponseSubscription, { teamId: teamContext.teamId }
      );
      
      teamContext.isSubscribed = true;
      teamContext.unsubscribe = stop;

      onResult(({ data }) => {
        if (data?.agentTeamResponse) {
          // The caller provides the context to the processor.
          processAgentTeamResponseEvent(teamContext, data.agentTeamResponse);
        }
      });

      onError((error) => {
        console.error(`Subscription error for application team ${teamContext.teamId}:`, error);
        stop();
        teamContext.isSubscribed = false;
      });
    },
  },
});
