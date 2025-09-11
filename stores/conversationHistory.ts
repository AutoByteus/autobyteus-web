import { defineStore } from 'pinia';
import { useQuery } from '@vue/apollo-composable';
import { GET_CONVERSATION_HISTORY } from '~/graphql/queries/conversation_queries';
import type { GetConversationHistoryQuery, GetConversationHistoryQueryVariables } from '~/generated/graphql';
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
    async fetchConversationHistory(this: ConversationHistoryState, page: number = this.currentPage, pageSize: number = this.pageSize) {
      if (!this.agentDefinitionId) {
        this.error = 'Agent definition ID is not set.';
        return;
      }

      this.loading = true;
      this.error = null;

      const variables: GetConversationHistoryQueryVariables = {
        agentDefinitionId: this.agentDefinitionId,
        page,
        pageSize,
        searchQuery: this.searchQuery || null, // Pass search query to variables
      };

      // `useQuery` should be called within a component's setup,
      // but for stores, we can manage it this way.
      // A better approach in a real app might be to refactor this into a composable.
      const { onResult, onError } = useQuery<GetConversationHistoryQuery, GetConversationHistoryQueryVariables>(
        GET_CONVERSATION_HISTORY,
        variables,
        {
          fetchPolicy: 'network-only',
        }
      );

      return new Promise<void>((resolve) => {
        onResult((result) => {
          if (result.loading) return;
          if (result.data?.getConversationHistory) {
            const { conversations, totalPages, currentPage } = result.data.getConversationHistory;
            this.conversations = conversations.map(conv => this.mapToConversation(conv));
            this.totalPages = totalPages;
            this.currentPage = currentPage;
          }
          this.loading = false;
          resolve();
        });

        onError((error) => {
          this.error = error.message || 'An error occurred while fetching conversation history.';
          this.loading = false;
          resolve(); // Resolve promise even on error
        });
      });
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
    mapToConversation(agentConversation: GetConversationHistoryQuery['getConversationHistory']['conversations'][number]): Conversation {
      // This function performs a "lightweight" mapping.
      // Heavy parsing is deferred to the agentContextsStore when a user continues a conversation.
      return {
        id: agentConversation.agentId, // This is the historical conversation ID
        messages: agentConversation.messages.map(msg => {
          if (msg.role === 'user') {
            const userMessage: UserMessage = {
              type: 'user',
              text: msg.originalMessage || '',
              contextFilePaths: msg.contextPaths?.map(path => ({
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
              chunks: [aiText], // Store the full text as a single chunk
              segments: [], // Segments will be populated on-demand by agentContextsStore
              isComplete: true,
              parserInstance: null as any, // No parser instance needed at this stage
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
        parseToolCalls: true,
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
