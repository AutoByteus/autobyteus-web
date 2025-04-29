import { defineStore } from 'pinia';
import { useQuery, useMutation } from '@vue/apollo-composable';
import { GET_PROMPTS, GET_PROMPT_BY_ID } from '~/graphql/queries/prompt_queries';
import { CREATE_PROMPT, SYNC_PROMPTS, DELETE_PROMPT } from '~/graphql/mutations/prompt_mutations';

interface Prompt {
  id: string;
  name: string;
  category: string;
  promptContent: string;
  description?: string | null;
  suitableForModels?: string | null;
  version: number;
  createdAt: string;
  parentPromptId?: string | null;
}

interface SyncResult {
  success: boolean;
  message: string;
  initialCount: number;
  finalCount: number;
  syncedCount: number;
}

interface DeleteResult {
  success: boolean;
  message: string;
}

interface PromptState {
  prompts: Prompt[];
  loading: boolean;
  error: string;
  selectedPrompt: Prompt | null;
  syncing: boolean;
  syncResult: SyncResult | null;
  deleteResult: DeleteResult | null;
}

export const usePromptStore = defineStore('prompt', {
  state: (): PromptState => ({
    prompts: [],
    loading: false,
    error: '',
    selectedPrompt: null,
    syncing: false,
    syncResult: null,
    deleteResult: null,
  }),

  actions: {
    async fetchActivePrompts() {
      this.loading = true;
      this.error = '';

      try {
        const { onResult, onError } = useQuery(GET_PROMPTS, null, {
          fetchPolicy: 'network-only',
        });

        return new Promise<Prompt[]>((resolve, reject) => {
          onResult((result) => {
            if (result.data?.activePrompts) {
              this.prompts = result.data.activePrompts;
              this.loading = false;
              resolve(result.data.activePrompts);
            }
          });

          onError((err) => {
            this.error = err.message;
            this.loading = false;
            reject(err);
          });
        });
      } catch (e: any) {
        this.error = e.message;
        this.loading = false;
        throw e;
      }
    },

    async fetchPromptById(id: string) {
      this.loading = true;
      this.error = '';

      try {
        const { onResult, onError } = useQuery(
          GET_PROMPT_BY_ID,
          { id },
          { fetchPolicy: 'network-only' },
        );

        return new Promise<Prompt | null>((resolve, reject) => {
          onResult((result) => {
            this.loading = false;
            if (result.data?.promptDetails) {
              this.selectedPrompt = result.data.promptDetails;
              resolve(result.data.promptDetails);
            } else {
              resolve(null);
            }
          });

          onError((err) => {
            this.error = err.message;
            this.loading = false;
            reject(err);
          });
        });
      } catch (e: any) {
        this.error = e.message;
        this.loading = false;
        throw e;
      }
    },

    async createPrompt(
      name: string,
      category: string,
      promptContent: string,
      description?: string,
      suitableForModels?: string,
    ) {
      try {
        const { mutate } = useMutation(CREATE_PROMPT);
        const response = await mutate({
          input: { name, category, promptContent, description, suitableForModels },
        });

        if (response?.data?.createPrompt) {
          await this.fetchActivePrompts();
          return response.data.createPrompt;
        }
        throw new Error('Failed to create prompt: No data returned');
      } catch (e: any) {
        this.error = e.message;
        throw e;
      }
    },

    async syncPrompts() {
      this.syncing = true;
      this.error = '';
      this.syncResult = null;

      try {
        const { mutate } = useMutation(SYNC_PROMPTS);
        const response = await mutate();

        if (response?.data?.syncPrompts) {
          this.syncResult = response.data.syncPrompts;
          
          // If sync was successful, refresh the prompts list
          if (this.syncResult.success) {
            await this.fetchActivePrompts();
          }
          
          return this.syncResult;
        }
        throw new Error('Failed to sync prompts: No data returned');
      } catch (e: any) {
        this.error = e.message;
        throw e;
      } finally {
        this.syncing = false;
      }
    },

    async deletePrompt(id: string) {
      this.loading = true;
      this.error = '';
      this.deleteResult = null;

      try {
        const { mutate } = useMutation(DELETE_PROMPT);
        const response = await mutate({
          input: { id },
        });

        if (response?.data?.deletePrompt) {
          this.deleteResult = response.data.deletePrompt;
          
          // If deletion was successful, refresh the prompts list
          if (this.deleteResult.success) {
            await this.fetchActivePrompts();
          }
          
          return this.deleteResult;
        }
        throw new Error('Failed to delete prompt: No data returned');
      } catch (e: any) {
        this.error = e.message;
        throw e;
      } finally {
        this.loading = false;
      }
    },

    setSelectedPrompt(prompt: Prompt | null) {
      this.selectedPrompt = prompt;
    },

    clearError() {
      this.error = '';
    },
    
    clearSyncResult() {
      this.syncResult = null;
    },
    
    clearDeleteResult() {
      this.deleteResult = null;
    }
  },

  getters: {
    getPrompts: (state): Prompt[] => state.prompts,
    getLoading: (state): boolean => state.loading,
    getError: (state): string => state.error,
    getSelectedPrompt: (state): Prompt | null => state.selectedPrompt,
    isSyncing: (state): boolean => state.syncing,
    getSyncResult: (state): SyncResult | null => state.syncResult,
    getDeleteResult: (state): DeleteResult | null => state.deleteResult,
  },
});
