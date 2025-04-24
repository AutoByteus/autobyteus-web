import { defineStore } from 'pinia';
import { useQuery, useMutation } from '@vue/apollo-composable';
import { GET_PROMPTS, GET_PROMPT_BY_ID } from '~/graphql/queries/prompt_queries';
import { CREATE_PROMPT } from '~/graphql/mutations/prompt_mutations';

interface Prompt {
  id: string;
  name: string;
  category: string;
  promptContent: string;
  description?: string | null;
  suitableForModel?: string | null;
  createdAt: string;
  parentPromptId?: string | null;
}

interface PromptState {
  prompts: Prompt[];
  loading: boolean;
  error: string;
  selectedPrompt: Prompt | null;
}

export const usePromptStore = defineStore('prompt', {
  state: (): PromptState => ({
    prompts: [],
    loading: false,
    error: '',
    selectedPrompt: null
  }),

  actions: {
    async fetchActivePrompts() {
      this.loading = true;
      this.error = '';
      
      try {
        const { onResult, onError } = useQuery(GET_PROMPTS, null, { 
          fetchPolicy: 'network-only' 
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
        const { onResult, onError } = useQuery(GET_PROMPT_BY_ID, 
          { id }, 
          { fetchPolicy: 'network-only' }
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
      suitableForModel?: string
    ) {
      try {
        const { mutate } = useMutation(CREATE_PROMPT);
        const response = await mutate({ 
          input: { name, category, promptContent, description, suitableForModel } 
        });

        if (response?.data?.createPrompt) {
          await this.fetchActivePrompts();
          return response.data.createPrompt;
        } else {
          throw new Error('Failed to create prompt: No data returned');
        }
      } catch (e: any) {
        this.error = e.message;
        throw e;
      }
    },

    setSelectedPrompt(prompt: Prompt | null) {
      this.selectedPrompt = prompt;
    },

    clearError() {
      this.error = '';
    }
  },

  getters: {
    getPrompts: (state): Prompt[] => state.prompts,
    getLoading: (state): boolean => state.loading,
    getError: (state): string => state.error,
    getSelectedPrompt: (state): Prompt | null => state.selectedPrompt
  }
});
