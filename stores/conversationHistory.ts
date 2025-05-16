import { defineStore } from 'pinia';
import { useQuery } from '@vue/apollo-composable';
import { GET_CONVERSATION_HISTORY } from '~/graphql/queries/conversation_queries';
import type { GetConversationHistoryQuery, GetConversationHistoryQueryVariables } from '~/generated/graphql';
import type { Conversation, UserMessage, AIMessage } from '~/types/conversation';
import { IncrementalAIResponseParser } from '~/utils/aiResponseParser/incrementalAIResponseParser';
import { useWorkflowStore } from '~/stores/workflow'; // Added

interface ConversationHistoryState {
  stepName: string | null;
  conversations: Conversation[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

export const useConversationHistoryStore = defineStore('conversationHistory', {
  state: (): ConversationHistoryState => ({
    stepName: null,
    conversations: [],
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    loading: false,
    error: null,
  }),
  actions: {
    setStepName(stepName: string) {
      this.stepName = stepName;
      this.currentPage = 1;
      this.conversations = [];
      this.totalPages = 1;
      this.fetchConversationHistory();
    },
    async fetchConversationHistory(this: ConversationHistoryState, page: number = this.currentPage, pageSize: number = this.pageSize) {
      if (!this.stepName) {
        this.error = 'Step name is not set.';
        return;
      }

      this.loading = true;
      this.error = null;

      const variables: GetConversationHistoryQueryVariables = {
        stepName: this.stepName,
        page,
        pageSize,
      };

      const { onResult, onError } = useQuery<GetConversationHistoryQuery, GetConversationHistoryQueryVariables>(
        GET_CONVERSATION_HISTORY,
        variables,
        {
          fetchPolicy: 'network-only',
        }
      );

      onResult((result) => {
        if (result.data?.getConversationHistory) {
          const { conversations, totalPages, currentPage } = result.data.getConversationHistory;
          this.conversations = conversations.map(conv => this.mapToConversation(conv));
          this.totalPages = totalPages;
          this.currentPage = currentPage;
        }
        this.loading = false;
      });

      onError((error) => {
        this.error = error.message || 'An error occurred while fetching conversation history.';
        this.loading = false;
      });
    },
    async nextPage() {
      if (this.currentPage < this.totalPages && this.stepName) {
        this.currentPage += 1;
        await this.fetchConversationHistory(this.currentPage, this.pageSize);
      }
    },
    async previousPage() {
      if (this.currentPage > 1 && this.stepName) {
        this.currentPage -= 1;
        await this.fetchConversationHistory(this.currentPage, this.pageSize);
      }
    },
    reset() {
      this.stepName = null;
      this.conversations = [];
      this.currentPage = 1;
      this.pageSize = 10;
      this.totalPages = 1;
      this.loading = false;
      this.error = null;
    },
    mapToConversation(stepConversation: GetConversationHistoryQuery['getConversationHistory']['conversations'][number]): Conversation {
      const workflowStore = useWorkflowStore();
      let stepId = '';

      if (this.stepName && workflowStore.currentWorkflow) {
        const foundStep = Object.entries(workflowStore.currentWorkflow.steps).find(
          ([, stepObj]) => stepObj.name === this.stepName
        );
        if (foundStep) {
          stepId = foundStep[0];
        } else {
          console.warn(`Could not find stepId for stepName: ${this.stepName}`);
        }
      } else {
          console.warn(`Cannot map stepName to stepId: stepName is ${this.stepName}, workflow is ${workflowStore.currentWorkflow ? 'defined' : 'null'}`);
      }


      return {
        id: stepConversation.stepConversationId, // This is the historical conversation ID
        stepId: stepId, // Populate stepId
        messages: stepConversation.messages.map(msg => {
          if (msg.role === 'user') {
            const userMessage: UserMessage = {
              type: 'user',
              text: msg.originalMessage || '',
              contextFilePaths: msg.contextPaths?.map(path => ({
                path,
                type: 'text', // Assuming text, adjust if type info is available
              })) || [],
              timestamp: new Date(msg.timestamp),
              promptTokens: msg.tokenCount || undefined,
              promptCost: msg.cost || undefined
            };
            return userMessage;
          } else {
            const aiText = msg.message || '';
            const segments: [] = []; // Type casting issue here, should be AIResponseSegment[]
            const parser = new IncrementalAIResponseParser(segments as any); // Add 'as any' to bypass temp type issue if AIResponseSegment is complex
            parser.processChunks([aiText]);

            const aiMessage: AIMessage = {
              type: 'ai',
              text: aiText,
              timestamp: new Date(msg.timestamp),
              chunks: [aiText],
              segments: segments as any, // Add 'as any'
              isComplete: true,
              parserInstance: parser,
              completionTokens: msg.tokenCount || undefined,
              completionCost: msg.cost || undefined
            };
            return aiMessage;
          }
        }),
        createdAt: stepConversation.createdAt,
        updatedAt: stepConversation.createdAt, // Should be stepConversation.updatedAt if available, using createdAt as fallback
      };
    }
  },
  getters: {
    isFirstPage: (state) => state.currentPage === 1,
    isLastPage: (state) => state.currentPage === state.totalPages,
    getConversations: (state) => state.conversations,
    getTotalPages: (state) => state.totalPages,
    getCurrentPage: (state) => state.currentPage,
  }
});
