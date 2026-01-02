import { defineStore } from 'pinia';
import { useApolloClient } from '@vue/apollo-composable';
import { GET_RAW_CONVERSATION_HISTORY } from '~/graphql/queries/conversation_queries';
import type { GetRawConversationHistoryQuery, GetRawConversationHistoryQueryVariables } from '~/generated/graphql';
import type { Conversation, UserMessage, AIMessage } from '~/types/conversation';

interface RawConversationHistoryState {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  pageSize: number;
  totalPages: number;
  
  // Filtering
  searchQuery: string;
  selectedAgentId: string | null;
  
  // Selection (Detail View)
  selectedConversationId: string | null;
}

export const useRawConversationHistoryStore = defineStore('rawConversationHistory', {
  state: (): RawConversationHistoryState => ({
    conversations: [],
    loading: false,
    error: null,
    
    currentPage: 1,
    pageSize: 20, 
    totalPages: 1,
    
    searchQuery: '',
    selectedAgentId: null,
    selectedConversationId: null,
  }),

  getters: {
    selectedConversation: (state) => 
      state.conversations.find(c => c.id === state.selectedConversationId) || null,
      
    isFirstPage: (state) => state.currentPage === 1,
    isLastPage: (state) => state.currentPage === state.totalPages,
  },

  actions: {
    // Renamed from fetchLogs to fetchRawConversationHistory for clarity and consistency
    async fetchRawConversationHistory(this: any, page: number = this.currentPage) {
      this.loading = true;
      this.error = null;

      const variables: GetRawConversationHistoryQueryVariables = {
        page,
        pageSize: this.pageSize,
        searchQuery: this.searchQuery || null,
        agentDefinitionId: this.selectedAgentId || null,
      };

      try {
        const { client } = useApolloClient();
        const { data, errors } = await client.query<GetRawConversationHistoryQuery, GetRawConversationHistoryQueryVariables>({
          query: GET_RAW_CONVERSATION_HISTORY,
          variables,
          fetchPolicy: 'network-only',
        });

        if (errors && errors.length > 0) {
          throw new Error(errors.map(e => e.message).join(', '));
        }

        if (data?.getRawConversationHistory) {
          const { conversations, totalPages, currentPage } = data.getRawConversationHistory;
          this.conversations = conversations.map(conv => this.mapToConversation(conv));
          this.totalPages = totalPages;
          this.currentPage = currentPage;
        }
      } catch (error: any) {
        this.error = error?.message || 'Failed to fetch conversation history.';
      } finally {
        this.loading = false;
      }
    },

    async performSearch(query: string) {
      this.searchQuery = query;
      this.currentPage = 1;
      await this.fetchRawConversationHistory();
    },
    
    async setSelectedAgentId(agentDefinitionId: string | null) {
      this.selectedAgentId = agentDefinitionId;
      this.currentPage = 1;
      await this.fetchRawConversationHistory();
    },
    
    async clearSearch() {
        this.searchQuery = '';
        this.currentPage = 1;
        await this.fetchRawConversationHistory();
    },

    async nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage += 1;
        await this.fetchRawConversationHistory(this.currentPage);
      }
    },

    async previousPage() {
      if (this.currentPage > 1) {
        this.currentPage -= 1;
        await this.fetchRawConversationHistory(this.currentPage);
      }
    },

    selectConversation(id: string) {
      this.selectedConversationId = id;
    },

    clearSelection() {
      this.selectedConversationId = null;
    },
    
    reset() {
        this.conversations = [];
        this.currentPage = 1;
        this.totalPages = 1;
        this.searchQuery = '';
        this.selectedAgentId = null;
        this.selectedConversationId = null;
        this.error = null;
        this.loading = false;
    },

    getFormattedConversationText(conversation: Conversation): string {
      return conversation.messages.map(msg => {
        const role = msg.type === 'user' ? 'User' : 'Assistant';
        const content = msg.text; 
        return `${role}:\n${content}`;
      }).join('\n\n');
    },

    mapToConversation(agentConversation: any): Conversation {
      return {
        id: agentConversation.agentId, 
        messages: agentConversation.messages.map((msg: any) => {
          if (msg.role === 'user') {
            const userMessage: UserMessage = {
              type: 'user',
              text: msg.message || '', 
              contextFilePaths: msg.contextPaths?.map((path: string) => ({
                path,
                type: 'Text', 
              })) || [],
              timestamp: new Date(msg.timestamp),
              promptTokens: msg.tokenCount || undefined,
              promptCost: msg.cost || undefined
            };
            (userMessage as any).originalMessage = msg.originalMessage;
            return userMessage;
          } else {
            const aiText = msg.message || '';
            const aiMessage: AIMessage = {
              type: 'ai',
              text: aiText,
              timestamp: new Date(msg.timestamp),
              segments: [], 
              isComplete: true,
              completionTokens: msg.tokenCount || undefined,
              completionCost: msg.cost || undefined,
              reasoning: msg.reasoning,
              imageUrls: msg.imageUrls,
              audioUrls: msg.audioUrls,
              videoUrls: msg.videoUrls
            };
            (aiMessage as any).originalMessage = msg.originalMessage;
            return aiMessage;
          }
        }),
        createdAt: agentConversation.createdAt,
        updatedAt: agentConversation.createdAt,
        llmModelIdentifier: agentConversation.llmModel || undefined,
        parseToolCalls: true,
        agentDefinitionId: agentConversation.agentDefinitionId,
        agentName: agentConversation.agentName,
        useXmlToolFormat: agentConversation.useXmlToolFormat,
      };
    }
  }
});
