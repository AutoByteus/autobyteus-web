import { defineStore } from 'pinia';
import { getApolloClient } from '~/utils/apolloClient';
import { GET_AGENT_MEMORY_VIEW } from '~/graphql/queries/agentMemoryViewQueries';
import type { GetAgentMemoryViewQuery, GetAgentMemoryViewQueryVariables } from '~/generated/graphql';
import type { AgentMemoryView } from '~/types/memory';

interface AgentMemoryViewState {
  selectedAgentId: string | null;
  memoryView: AgentMemoryView | null;
  loading: boolean;
  error: string | null;
  rawTraceLimit: number;
  conversationLimit: number;
  includeRawTraces: boolean;
  requestId: number;
}

export const useAgentMemoryViewStore = defineStore('agentMemoryViewStore', {
  state: (): AgentMemoryViewState => ({
    selectedAgentId: null,
    memoryView: null,
    loading: false,
    error: null,
    rawTraceLimit: 500,
    conversationLimit: 200,
    includeRawTraces: false,
    requestId: 0,
  }),

  actions: {
    async fetchMemoryView(agentId?: string): Promise<AgentMemoryView | null> {
      const resolvedAgentId = agentId || this.selectedAgentId;
      if (!resolvedAgentId) {
        return null;
      }

      this.loading = true;
      this.error = null;
      const currentRequestId = ++this.requestId;

      try {
        const client = getApolloClient();
        const { data, errors } = await client.query<
          GetAgentMemoryViewQuery,
          GetAgentMemoryViewQueryVariables
        >({
          query: GET_AGENT_MEMORY_VIEW,
          variables: {
            agentId: resolvedAgentId,
            includeWorkingContext: true,
            includeEpisodic: true,
            includeSemantic: true,
            includeRawTraces: this.includeRawTraces,
            includeArchive: false,
            rawTraceLimit: this.rawTraceLimit,
            conversationLimit: this.conversationLimit,
          },
          fetchPolicy: 'network-only',
        });

        if (errors && errors.length > 0) {
          throw new Error(errors.map((e: { message: string }) => e.message).join(', '));
        }

        if (currentRequestId !== this.requestId) {
          return null;
        }

        const payload = data?.getAgentMemoryView as AgentMemoryView | undefined;
        if (!payload) {
          return null;
        }

        this.memoryView = payload;
        return payload;
      } catch (error: any) {
        if (currentRequestId === this.requestId) {
          this.error = error?.message || 'Failed to fetch memory view.';
        }
        return null;
      } finally {
        if (currentRequestId === this.requestId) {
          this.loading = false;
        }
      }
    },

    async setSelectedAgentId(agentId: string | null) {
      this.selectedAgentId = agentId;
      this.includeRawTraces = false;
      if (agentId) {
        await this.fetchMemoryView(agentId);
      }
    },

    async setIncludeRawTraces(value: boolean) {
      if (this.includeRawTraces === value) {
        return;
      }
      this.includeRawTraces = value;
      if (value && this.selectedAgentId) {
        await this.fetchMemoryView(this.selectedAgentId);
      }
    },

    async setRawTraceLimit(limit: number) {
      this.rawTraceLimit = limit;
      if (this.includeRawTraces && this.selectedAgentId) {
        await this.fetchMemoryView(this.selectedAgentId);
      }
    },

    async setConversationLimit(limit: number) {
      this.conversationLimit = limit;
      if (this.selectedAgentId && this.includeRawTraces) {
        await this.fetchMemoryView(this.selectedAgentId);
      }
    },

    clearSelection() {
      this.selectedAgentId = null;
      this.memoryView = null;
      this.error = null;
      this.includeRawTraces = false;
    },
  },
});
