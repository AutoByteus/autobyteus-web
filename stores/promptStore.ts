import { defineStore } from 'pinia';
import { useQuery, useMutation } from '@vue/apollo-composable';
import { GET_PROMPTS, GET_PROMPT_BY_ID } from '~/graphql/queries/prompt_queries';
import { CREATE_PROMPT, UPDATE_PROMPT, ADD_NEW_PROMPT_REVISION, SYNC_PROMPTS, DELETE_PROMPT, MARK_ACTIVE_PROMPT } from '~/graphql/mutations/prompt_mutations';
import { useAgentDefinitionOptionsStore } from '~/stores/agentDefinitionOptionsStore';

interface Prompt {
  id: string;
  name: string;
  category: string;
  promptContent: string;
  description?: string | null;
  suitableForModels?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  parentPromptId?: string | null;
  isActive: boolean;
  isForWorkflow: boolean;
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
    async fetchPrompts(isActive: boolean | null = null) {
      this.loading = true;
      this.error = '';

      try {
        const { onResult, onError } = useQuery(GET_PROMPTS, { isActive }, {
          fetchPolicy: 'network-only',
        });

        return new Promise<Prompt[]>((resolve, reject) => {
          onResult((result) => {
            if (result.data?.prompts) {
              this.prompts = result.data.prompts;
              this.loading = false;
              resolve(result.data.prompts);
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
            // The query returns `promptDetails`, not `prompt`.
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
      isForWorkflow?: boolean,
    ) {
      try {
        const { mutate } = useMutation(CREATE_PROMPT);
        const response = await mutate({
          input: { name, category, promptContent, description, suitableForModels, isForWorkflow },
        });

        if (response?.data?.createPrompt) {
          await this.fetchPrompts(); // Fetch all prompts after creation
          useAgentDefinitionOptionsStore().invalidateCache();
          return response.data.createPrompt;
        }
        throw new Error('Failed to create prompt: No data returned');
      } catch (e: any) {
        this.error = e.message;
        throw e;
      }
    },
    
    async updatePrompt(
      id: string,
      promptContent?: string,
      description?: string,
      suitableForModels?: string,
      isActive?: boolean
    ) {
      try {
        const { mutate } = useMutation(UPDATE_PROMPT);
        const response = await mutate({
          input: { id, promptContent, description, suitableForModels, isActive },
        });

        if (response?.data?.updatePrompt) {
          await this.fetchPrompts(); // Fetch all prompts after update
          useAgentDefinitionOptionsStore().invalidateCache();
          return response.data.updatePrompt;
        }
        throw new Error('Failed to update prompt: No data returned');
      } catch (e: any) {
        this.error = e.message;
        throw e;
      }
    },

    async addNewPromptRevision(
      id: string,
      newPromptContent: string,
    ) {
      try {
        const { mutate } = useMutation(ADD_NEW_PROMPT_REVISION);
        const response = await mutate({
          input: { id, newPromptContent },
        });

        if (response?.data?.addNewPromptRevision) {
          await this.fetchPrompts(); // Fetch all prompts after adding revision
          return response.data.addNewPromptRevision;
        }
        throw new Error('Failed to add new prompt revision: No data returned');
      } catch (e: any) {
        this.error = e.message;
        throw e;
      }
    },
    
    async setActivePrompt(promptId: string) {
      try {
        const { mutate } = useMutation(MARK_ACTIVE_PROMPT);
        const response = await mutate({ input: { id: promptId } });

        if (response?.data?.markActivePrompt) {
          await this.fetchPrompts(); // Refresh the entire list to show status changes
          return response.data.markActivePrompt;
        }
        throw new Error('Failed to mark prompt as active: No data returned');
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
          
          if (this.syncResult.success) {
            await this.fetchPrompts(); // Fetch all prompts after sync
            useAgentDefinitionOptionsStore().invalidateCache();
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
          
          if (this.deleteResult.success) {
            await this.fetchPrompts(); // Fetch all prompts after deletion
            useAgentDefinitionOptionsStore().invalidateCache();
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
