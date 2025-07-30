import { defineStore } from 'pinia';
import { useMutation, useSubscription } from '@vue/apollo-composable';
import { SendAgentUserInput, TerminateAgentInstance, ApproveToolInvocation } from '~/graphql/mutations/agentMutations';
import { AgentResponseSubscription } from '~/graphql/subscriptions/agent_response_subscriptions';
import type {
  SendAgentUserInputMutation,
  SendAgentUserInputMutationVariables,
  AgentResponseSubscription as AgentResponseSubscriptionType,
  AgentResponseSubscriptionVariables,
  ApproveToolInvocationMutation,
  ApproveToolInvocationMutationVariables,
  ContextFileType,
} from '~/generated/graphql';
import type { Conversation, Message, ContextFilePath, AIMessage } from '~/types/conversation';
import { useAgentLaunchProfileStore } from '~/stores/agentLaunchProfileStore';
import { useConversationHistoryStore } from '~/stores/conversationHistory';
import { IncrementalAIResponseParser } from '~/utils/aiResponseParser/incrementalAIResponseParser';
import { processAgentResponseEvent } from '~/services/agentResponseProcessor';
import { AgentContext } from '~/types/agent/AgentContext';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';
import { AgentRunState } from '~/types/agent/AgentRunState';
import { ParserContext } from '~/utils/aiResponseParser/stateMachine/ParserContext';
import type { ToolCallSegment } from '~/utils/aiResponseParser/types';

// State related to a specific Agent Launch Profile
interface ProfileAgentState {
  activeAgents: Map<string, AgentContext>;
  selectedAgentId: string | null;
}

// The main store state, organizing agent runs by launch profile
interface AgentRunStoreState {
  agentsByLaunchProfile: Map<string, ProfileAgentState>;
}

const createDefaultProfileState = (): ProfileAgentState => ({
  activeAgents: new Map(),
  selectedAgentId: null,
});

export const useAgentRunStore = defineStore('agentRun', {
  state: (): AgentRunStoreState => ({
    agentsByLaunchProfile: new Map(),
  }),

  getters: {
    // Helper to safely access the current launch profile's state
    _currentProfileState(state): ProfileAgentState | null {
      const launchProfileStore = useAgentLaunchProfileStore();
      const activeProfileId = launchProfileStore.activeProfileId;
      if (!activeProfileId) return null;
      return state.agentsByLaunchProfile.get(activeProfileId) || null;
    },

    allOpenAgents(): AgentContext[] {
      return this._currentProfileState ? Array.from(this._currentProfileState.activeAgents.values()) : [];
    },

    selectedAgent(): AgentContext | null {
      if (!this._currentProfileState || !this._currentProfileState.selectedAgentId) return null;
      return this._currentProfileState.activeAgents.get(this._currentProfileState.selectedAgentId) || null;
    },

    selectedAgentId(): string | null {
      return this._currentProfileState?.selectedAgentId || null;
    },

    currentContextPaths(): ContextFilePath[] {
      return this.selectedAgent?.contextFilePaths ?? [];
    },
    
    currentRequirement(): string {
      return this.selectedAgent?.requirement ?? '';
    },

    isCurrentlySending(): boolean {
      return this.selectedAgent?.isSending ?? false;
    },

    getAgentContextById: (state) => (agentId: string): AgentContext | undefined => {
      for (const profileState of state.agentsByLaunchProfile.values()) {
        const agentContext = profileState.activeAgents.get(agentId);
        if (agentContext) {
          return agentContext;
        }
      }
      return undefined;
    },
  },

  actions: {
    _getOrCreateCurrentProfileState(): ProfileAgentState {
      const launchProfileStore = useAgentLaunchProfileStore();
      const activeProfileId = launchProfileStore.activeProfileId;
      if (!activeProfileId) {
        throw new Error("Cannot access agent run state: No agent launch profile is active.");
      }
      if (!this.agentsByLaunchProfile.has(activeProfileId)) {
        this.agentsByLaunchProfile.set(activeProfileId, createDefaultProfileState());
      }
      return this.agentsByLaunchProfile.get(activeProfileId)!;
    },

    setSelectedAgentId(agentId: string | null) {
      try {
        const profileState = this._getOrCreateCurrentProfileState();
        profileState.selectedAgentId = agentId;
      } catch (e) {
        console.error(e);
      }
    },

    createNewAgent() {
      const launchProfileStore = useAgentLaunchProfileStore();
      const activeLaunchProfile = launchProfileStore.activeLaunchProfile;
      if (!activeLaunchProfile) {
        console.error('Cannot create new agent run without an active launch profile.');
        return;
      }
      const profileState = this._getOrCreateCurrentProfileState();
      
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      const newConversation: Conversation = {
        id: tempId,
        messages: [],
        createdAt: now,
        updatedAt: now,
        agentDefinitionId: activeLaunchProfile.agentDefinition.id,
      };
      
      const agentConfig: AgentRunConfig = {
        launchProfileId: activeLaunchProfile.id,
        workspaceId: activeLaunchProfile.workspaceId,
        llmModelName: '', // To be selected by the user
        autoExecuteTools: false,
        useXmlToolFormat: true,
        parseToolCalls: true,
      };

      const agentState = new AgentRunState(tempId, newConversation);
      const newAgentContext = new AgentContext(agentConfig, agentState);

      profileState.activeAgents.set(tempId, newAgentContext);
      profileState.selectedAgentId = tempId;
    },

    updateSelectedAgentConfig(updates: Partial<AgentRunConfig>) {
        if (this.selectedAgent) {
            Object.assign(this.selectedAgent.config, updates);
        }
    },

    updateUserRequirement(newRequirement: string) {
      if (this.selectedAgent) {
        this.selectedAgent.requirement = newRequirement;
      }
    },

    async closeAgent(agentIdToClose: string, options: { terminate: boolean }) {
      const profileState = this._getOrCreateCurrentProfileState();
      const agentToClose = profileState.activeAgents.get(agentIdToClose);

      if (!agentToClose) return;

      // Unsubscribe if a subscription exists
      if (agentToClose.unsubscribe) {
        agentToClose.unsubscribe();
        agentToClose.isSubscribed = false;
        agentToClose.unsubscribe = undefined;
      }

      // Remove the agent from the map
      profileState.activeAgents.delete(agentIdToClose);
      
      // If the closed agent was selected, select another one
      if (profileState.selectedAgentId === agentIdToClose) {
        const openAgentsArray = Array.from(profileState.activeAgents.values());
        profileState.selectedAgentId = openAgentsArray.length > 0 ? openAgentsArray[openAgentsArray.length - 1].state.agentId : null;
      }

      // Conditionally terminate the backend instance
      if (options.terminate && !agentIdToClose.startsWith('temp-')) {
        try {
          const { mutate: terminateAgentInstanceMutation } = useMutation(TerminateAgentInstance);
          await terminateAgentInstanceMutation({ id: agentIdToClose });
        } catch (error) {
          console.error('Error closing agent on backend:', error);
        }
      }
    },

    addMessageToAgent(agentId: string, message: Message) {
      const profileState = this._getOrCreateCurrentProfileState();
      const agent = profileState.activeAgents.get(agentId);
      if (agent) {
        agent.state.conversation.messages.push(message);
        agent.state.conversation.updatedAt = new Date().toISOString();
      }
    },

    async sendUserInputAndSubscribe(): Promise<void> {
      const profileState = this._getOrCreateCurrentProfileState();
      const currentAgent = this.selectedAgent;
      if (!currentAgent) {
        throw new Error('No active agent selected.');
      }

      const { config, state } = currentAgent;
      const agentId = state.agentId;
      const isNewAgent = agentId.startsWith('temp-');

      if (isNewAgent && !config.llmModelName) {
        throw new Error("Please select a model for the first message.");
      }

      if (isNewAgent) {
        state.conversation.llmModelName = config.llmModelName;
        state.conversation.useXmlToolFormat = config.useXmlToolFormat;
        state.conversation.parseToolCalls = config.parseToolCalls;
      }

      this.addMessageToAgent(agentId, {
        type: 'user', text: currentAgent.requirement, timestamp: new Date(), contextFilePaths: currentAgent.contextFilePaths
      });

      currentAgent.isSending = true;
      const { mutate: sendAgentUserInputMutation } = useMutation<SendAgentUserInputMutation, SendAgentUserInputMutationVariables>(SendAgentUserInput);

      try {
        const result = await sendAgentUserInputMutation({
          input: {
            userInput: {
              content: currentAgent.requirement,
              contextFiles: currentAgent.contextFilePaths.map(cf => ({ path: cf.path, type: cf.type.toUpperCase() as ContextFileType })),
            },
            agentId: isNewAgent ? null : agentId,
            agentDefinitionId: state.conversation.agentDefinitionId,
            workspaceId: config.workspaceId,
            llmModelName: config.llmModelName,
            autoExecuteTools: config.autoExecuteTools,
            useXmlToolFormat: config.useXmlToolFormat,
          }
        });

        const permanentAgentId = result?.data?.sendAgentUserInput?.agentId;
        if (!permanentAgentId) {
          throw new Error('Failed to send user input: No agentId returned.');
        }

        let finalAgentId = agentId;
        if (isNewAgent) {
          finalAgentId = permanentAgentId;
          const tempAgent = profileState.activeAgents.get(agentId)!;
          tempAgent.state.promoteTemporaryId(permanentAgentId);

          profileState.activeAgents.set(permanentAgentId, tempAgent);
          profileState.activeAgents.delete(agentId);
          
          if (profileState.selectedAgentId === agentId) {
            profileState.selectedAgentId = permanentAgentId;
          }
        }
        
        const finalAgent = profileState.activeAgents.get(finalAgentId)!;
        finalAgent.requirement = '';
        finalAgent.contextFilePaths = [];

        if (!finalAgent.isSubscribed) {
          this.subscribeToAgentResponse(finalAgentId);
        }

        const conversationHistoryStore = useConversationHistoryStore();
        if (state.conversation.agentDefinitionId && conversationHistoryStore.agentDefinitionId === state.conversation.agentDefinitionId) {
           await conversationHistoryStore.fetchConversationHistory();
        }
      } catch (error) {
        console.error('Error sending user input:', error);
        currentAgent.isSending = false;
        throw error;
      }
    },

    subscribeToAgentResponse(agentId: string) {
      const profileState = this._getOrCreateCurrentProfileState();
      const { onResult, onError, stop } = useSubscription<AgentResponseSubscriptionType, AgentResponseSubscriptionVariables>(
        AgentResponseSubscription, { agentId }
      );
      
      const agent = profileState.activeAgents.get(agentId);
      if (agent) {
        agent.isSubscribed = true;
        agent.unsubscribe = stop;
      }

      onResult(({ data }) => {
        if (!data?.agentResponse) return;
        
        const { agentId: respAgentId, data: eventData } = data.agentResponse;
        
        // Find the agent context using the ID from the event
        const agentToUpdate = this.getAgentContextById(respAgentId);

        if (!agentToUpdate) {
            console.warn(`Received event for unknown or closed agent with ID: ${respAgentId}. Ignoring.`);
            return;
        }

        agentToUpdate.isSending = false;

        if (eventData) {
            processAgentResponseEvent(eventData, agentToUpdate);
        }
      });

      onError((error) => {
        console.error(`Subscription error for agent ${agentId}:`, error);
        stop();
        const agentOnError = profileState.activeAgents.get(agentId);
        if(agentOnError) {
          agentOnError.isSubscribed = false;
          agentOnError.unsubscribe = undefined;
        }
      });
    },
    
    async postToolExecutionApproval(agentId: string, invocationId: string, isApproved: boolean, reason: string | null = null) {
      const { mutate: approveToolInvocationMutation } = useMutation<ApproveToolInvocationMutation, ApproveToolInvocationMutationVariables>(ApproveToolInvocation);
      try {
        await approveToolInvocationMutation({ input: { agentId, invocationId, isApproved, reason }});
        
        const agent = this._getOrCreateCurrentProfileState().activeAgents.get(agentId);
        if (agent) {
          const segment = agent.state.conversation.messages
            .flatMap(m => m.type === 'ai' ? m.segments : [])
            .find(s => s.type === 'tool_call' && s.invocationId === invocationId) as ToolCallSegment | undefined;
          if (segment) {
            segment.status = isApproved ? 'executing' : 'denied';
          }
        }
      } catch (error) {
        console.error("Error posting tool execution approval:", error);
      }
    },

    addContextFilePath(contextFilePath: ContextFilePath) {
      if (this.selectedAgent) {
        this.selectedAgent.contextFilePaths.push(contextFilePath);
      }
    },

    removeContextFilePath(index: number) {
      if (this.selectedAgent) {
        this.selectedAgent.contextFilePaths.splice(index, 1);
      }
    },

    clearContextFilePaths() {
      if (this.selectedAgent) {
        this.selectedAgent.contextFilePaths = [];
      }
    },

    setAgentFromHistory(historicalConversationData: Conversation) {
      const launchProfileStore = useAgentLaunchProfileStore();
      const activeLaunchProfile = launchProfileStore.activeLaunchProfile;
      if (!activeLaunchProfile) {
        console.error("Cannot set agent from history: No active launch profile.");
        return;
      }
    
      const profileState = this._getOrCreateCurrentProfileState();
      const tempId = `temp-hist-${Date.now()}`;
    
      // Create the final AgentContext first
      const agentConfig: AgentRunConfig = {
        launchProfileId: activeLaunchProfile.id,
        workspaceId: activeLaunchProfile.workspaceId,
        llmModelName: historicalConversationData.llmModelName || '',
        autoExecuteTools: false,
        useXmlToolFormat: historicalConversationData.useXmlToolFormat ?? true,
        parseToolCalls: historicalConversationData.parseToolCalls ?? true,
      };
      
      const newAgentState = new AgentRunState(tempId, {
        ...historicalConversationData,
        id: tempId,
        messages: [], // Start with empty messages
      });
      const newAgentContext = new AgentContext(agentConfig, newAgentState);
    
      // Now, re-process messages one by one
      const originalMessages = historicalConversationData.messages;
      for (const msg of originalMessages) {
        if (msg.type === 'user') {
          newAgentContext.conversation.messages.push(msg);
        } else if (msg.type === 'ai') {
          const aiMessage: AIMessage = {
            ...(msg as AIMessage),
            segments: [],
            isComplete: false,
            parserInstance: null as any, // Placeholder
          };
          newAgentContext.conversation.messages.push(aiMessage); // Add to conversation so lastAIMessage is correct
    
          const parserContext = new ParserContext(newAgentContext);
          const parser = new IncrementalAIResponseParser(parserContext);
    
          if (msg.text) {
            parser.processChunks([msg.text]);
          }
          parser.finalize();
    
          aiMessage.parserInstance = parser;
          aiMessage.isComplete = true;
        }
      }
      
      profileState.activeAgents.set(tempId, newAgentContext);
      profileState.selectedAgentId = tempId;
    },
    
    ensureAgentForLaunchProfile(profileId: string): void {
      if (!profileId) return;
      if (!this.agentsByLaunchProfile.has(profileId)) {
        this.agentsByLaunchProfile.set(profileId, createDefaultProfileState());
      }
      const profileState = this.agentsByLaunchProfile.get(profileId)!;
      if (profileState.activeAgents.size === 0) {
        this.createNewAgent();
      } else {
         const latestAgent = Array.from(profileState.activeAgents.values()).sort((a, b) => 
            new Date(b.state.conversation.updatedAt).getTime() - new Date(a.state.conversation.updatedAt).getTime()
         )[0];
         profileState.selectedAgentId = latestAgent.state.agentId;
      }
    },
  },
});
