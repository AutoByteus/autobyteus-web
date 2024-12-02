import { defineStore } from 'pinia';
import { useQuery } from '@vue/apollo-composable';
import { GET_CONVERSATION_HISTORY, GET_COST_SUMMARY } from '~/graphql/queries/conversation_queries';
import type { GetConversationHistoryQuery, GetConversationHistoryQueryVariables } from '~/generated/graphql';
import type { Conversation, Message, UserMessage, AIMessage } from '~/types/conversation';

interface ConversationHistoryState {
  stepName: string | null;
  conversations: Conversation[];
  totalCost: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  timeFrame: string; // Add timeFrame to state
}

export const useConversationHistoryStore = defineStore('conversationHistory', {
  state: (): ConversationHistoryState => ({
    stepName: null,
    conversations: [],
    totalCost: 0,
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    loading: false,
    error: null,
    timeFrame: 'week', // Default to 'week'
  }),
  actions: {
    setStepName(stepName: string) {
      this.stepName = stepName;
      this.currentPage = 1;
      this.conversations = [];
      this.totalPages = 1;
      this.fetchConversationHistory();
      this.fetchTotalCost();
    },
    async fetchTotalCost(timeFrame: string = this.timeFrame) {
      if (!this.stepName) {
        this.error = 'Step name is not set.';
        return;
      }
      this.timeFrame = timeFrame; // Update timeFrame in state
      const variables: GetCostSummaryQueryVariables = {
        stepName: this.stepName,
        timeFrame,
      };
      const { onResult, onError } = useQuery<GetCostSummaryQuery, GetCostSummaryQueryVariables>(
        GET_COST_SUMMARY,
        variables,
        {
          fetchPolicy: 'network-only',
        }
      );
      onResult((result) => {
        if (result.data?.getCostSummary !== undefined) {
          this.totalCost = result.data.getCostSummary;
        }
      });
      onError((error) => {
        this.error = error.message || 'An error occurred while fetching total cost.';
      });
    },
    async fetchConversationHistory(page: number = this.currentPage, pageSize: number = this.pageSize) {
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
          fetchPolicy: 'network-only', // Ensures the query bypasses the cache and fetches fresh data
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
      this.timeFrame = 'week';
    },
    mapToConversation(stepConversation: GetConversationHistoryQuery['getConversationHistory']['conversations'][number]): Conversation {
      return {
        id: stepConversation.stepConversationId,
        messages: stepConversation.messages.map(msg => {
        const cost = typeof msg.cost === 'number' ? msg.cost : 0;
          if (msg.role === 'user') {
            const userMessage: UserMessage = {
              type: 'user',
              text: msg.originalMessage || '',
              contextFilePaths: msg.contextPaths?.map(path => ({
                path,
                type: 'text',
              })) || [],
              timestamp: new Date(msg.timestamp),
              cost: msg.cost || 0,  // Include cost
            };
            return userMessage;
          } else {
            const aiMessage: AIMessage = {
              type: 'ai',
              text: msg.message || '',
              timestamp: new Date(msg.timestamp),
              cost: msg.cost || 0,  // Include cost
            };
            return aiMessage;
          }
        }),
      totalCost: typeof stepConversation.totalCost === 'number' ? stepConversation.totalCost : 0,
        createdAt: stepConversation.createdAt,
        updatedAt: stepConversation.createdAt,
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