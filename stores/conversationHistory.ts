import { defineStore } from 'pinia';
import { useQuery } from '@vue/apollo-composable';
import { GET_CONVERSATION_HISTORY } from '~/graphql/queries/conversation_queries';
import type { GetConversationHistoryQuery, GetConversationHistoryQueryVariables } from '~/generated/graphql';
import type { Conversation, UserMessage, AIMessage } from '~/types/conversation';
import { IncrementalAIResponseParser } from '~/utils/aiResponseParser/incrementalAIResponseParser';

interface ConversationHistoryState {
  agentDefinitionId: string | null;
  conversations: Conversation[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
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
  }),
  actions: {
    setAgentDefinitionId(agentDefinitionId: string) {
      this.agentDefinitionId = agentDefinitionId;
      this.currentPage = 1;
      this.conversations = [];
      this.totalPages = 1;
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
    },
    mapToConversation(agentConversation: GetConversationHistoryQuery['getConversationHistory']['conversations'][number]): Conversation {
      // The concept of a workflow and steps has been removed.
      // The `stepId` has been removed from the Conversation type.
      return {
        id: agentConversation.agentId, // This is the historical conversation ID
        messages: agentConversation.messages.map(msg => {
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
        createdAt: agentConversation.createdAt,
        updatedAt: agentConversation.createdAt, // Should be agentConversation.updatedAt if available, using createdAt as fallback
        // Pass along additional properties for when continuing a conversation.
        // This assumes the Conversation type supports these optional fields.
        llmModelName: agentConversation.llmModel || undefined,
        useXmlToolFormat: agentConversation.useXmlToolFormat,
        agentDefinitionId: agentConversation.agentDefinitionId,
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
