import { defineStore } from 'pinia';
import { useApolloClient } from '@vue/apollo-composable';
import { GET_AGENT_CONVERSATION_HISTORY } from '~/graphql/queries/conversation_queries';
import type { GetAgentConversationHistoryQuery, GetAgentConversationHistoryQueryVariables } from '~/generated/graphql';
import type { Conversation, UserMessage, AIMessage } from '~/types/conversation';

interface ConversationHistoryState {
  agentDefinitionId: string | null;
  conversations: Conversation[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  searchQuery: string; // New state for the search query
}

export const useConversationHistoryStore = defineStore('conversationHistory', {
  state: (): ConversationHistoryState => ({
    agentDefinitionId: null,
    conversations: [],
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    loading: false,
    error: null,
    searchQuery: '', // Initialize search query
  }),
  actions: {
    setAgentDefinitionId(agentDefinitionId: string) {
      this.agentDefinitionId = agentDefinitionId;
      this.currentPage = 1;
      this.conversations = [];
      this.totalPages = 1;
      this.searchQuery = ''; // Reset search on new agent selection
      this.fetchConversationHistory();
    },
    async fetchConversationHistory(this: any, page: number = this.currentPage, pageSize: number = this.pageSize) {
      if (!this.agentDefinitionId) {
        this.error = 'Agent definition ID is not set.';
        return;
      }

      this.loading = true;
      this.error = null;

      const variables: GetAgentConversationHistoryQueryVariables = {
        agentDefinitionId: this.agentDefinitionId,
        page,
        pageSize,
        searchQuery: this.searchQuery || null, // Pass search query to variables
      };

      try {
        const { client } = useApolloClient();
        const { data, errors } = await client.query<GetAgentConversationHistoryQuery, GetAgentConversationHistoryQueryVariables>({
          query: GET_AGENT_CONVERSATION_HISTORY,
          variables,
          fetchPolicy: 'network-only',
        });

        if (errors && errors.length > 0) {
          throw new Error(errors.map(e => e.message).join(', '));
        }

        if (data?.getAgentConversationHistory) {
          const { conversations, totalPages, currentPage } = data.getAgentConversationHistory;
          this.conversations = conversations.map(conv => this.mapToConversation(conv));
          this.totalPages = totalPages;
          this.currentPage = currentPage;
        }
      } catch (error: any) {
        this.error = error?.message || 'An error occurred while fetching conversation history.';
      } finally {
        this.loading = false;
      }
    },
    async performSearch(query: string) {
      this.searchQuery = query;
      this.currentPage = 1; // Reset to first page for new search
      await this.fetchConversationHistory();
    },
    async clearSearch() {
      this.searchQuery = '';
      this.currentPage = 1;
      await this.fetchConversationHistory();
    },
    async nextPage() {
      if (this.currentPage < this.totalPages && this.agentDefinitionId) {
        this.currentPage += 1;
        await this.fetchConversationHistory(this.currentPage, this.pageSize);
      }
    },
    async previousPage() {
      if (this.currentPage > 1 && this.agentDefinitionId) {
        this.currentPage -= 1;
        await this.fetchConversationHistory(this.currentPage, this.pageSize);
      }
    },
    reset() {
      this.agentDefinitionId = null;
      this.conversations = [];
      this.currentPage = 1;
      this.pageSize = 10;
      this.totalPages = 1;
      this.loading = false;
      this.error = null;
      this.searchQuery = '';
    },
    mapToConversation(agentConversation: any): Conversation {
      // This function performs a "lightweight" mapping.
      // Heavy parsing is deferred to the agentContextsStore when a user continues a conversation.
      return {
        id: agentConversation.agentId, // This is the historical conversation ID
        messages: agentConversation.messages.map((msg: any) => {
          if (msg.role === 'user') {
            const userMessage: UserMessage = {
              type: 'user',
              text: msg.originalMessage || '',
              contextFilePaths: msg.contextPaths?.map((path: string) => ({
                path,
                type: 'Text', // Standardize to match ContextFilePath type
              })) || [],
              timestamp: new Date(msg.timestamp),
              promptTokens: msg.tokenCount || undefined,
              promptCost: msg.cost || undefined
            };
            return userMessage;
          } else {
            const aiText = msg.message || '';
            const aiMessage: AIMessage = {
              type: 'ai',
              text: aiText,
              timestamp: new Date(msg.timestamp),
              segments: [], // Segments will be populated on-demand by agentContextsStore
              isComplete: true,
              completionTokens: msg.tokenCount || undefined,
              completionCost: msg.cost || undefined,
              reasoning: msg.reasoning,
              imageUrls: msg.imageUrls,
              audioUrls: msg.audioUrls,
              videoUrls: msg.videoUrls
            };
            return aiMessage;
          }
        }),
        createdAt: agentConversation.createdAt,
        updatedAt: agentConversation.createdAt,
        llmModelIdentifier: agentConversation.llmModel || undefined,

        agentDefinitionId: agentConversation.agentDefinitionId,
        useXmlToolFormat: agentConversation.useXmlToolFormat,
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
