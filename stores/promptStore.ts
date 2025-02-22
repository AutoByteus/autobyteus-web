import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useQuery, useMutation } from '@vue/apollo-composable';
import { GET_PROMPTS, GET_PROMPT_BY_ID } from '~/graphql/queries/prompt_queries';
import { CREATE_PROMPT } from '~/graphql/mutations/prompt_mutations';

// Define the Prompt interface with camelCase and correct id type
interface Prompt {
  id: string;  // Changed from number to string to match backend
  name: string;
  category: string;
  promptText: string;
  createdAt: string;
  parentPromptId?: string | null;
}

export const usePromptStore = defineStore('prompt', () => {
  const prompts = ref<Prompt[]>([]);
  const loading = ref(false);
  const error = ref('');

  const fetchActivePrompts = async () => {
    loading.value = true;
    error.value = '';
    try {
      const { onResult, onError } = useQuery(GET_PROMPTS, null, { fetchPolicy: 'network-only' });
      onResult((result) => {
        if (result.data && result.data.activePrompts) {
          prompts.value = result.data.activePrompts;
        }
        loading.value = false;
      });
      onError((err) => {
        error.value = err.message;
        loading.value = false;
      });
    } catch (e: any) {
      error.value = e.message;
      loading.value = false;
    }
  };

  const fetchPromptById = async (id: string): Promise<Prompt | null> => {
    loading.value = true;
    error.value = '';
    try {
      const { onResult, onError } = useQuery(GET_PROMPT_BY_ID, { id }, { fetchPolicy: 'network-only' });
      return new Promise((resolve) => {
        onResult((result) => {
          loading.value = false;
          if (result.data && result.data.promptDetails) {
            resolve(result.data.promptDetails);
          } else {
            resolve(null);
          }
        });
        onError((err) => {
          error.value = err.message;
          loading.value = false;
          resolve(null);
        });
      });
    } catch (e: any) {
      error.value = e.message;
      loading.value = false;
      throw e;
    }
  };

  const createPrompt = async (name: string, category: string, promptText: string) => {
    try {
      const { mutate } = useMutation(CREATE_PROMPT);
      const response = await mutate({ input: { name, category, promptText } });
      if (response && response.data && response.data.createPrompt) {
        await fetchActivePrompts();
      } else {
        throw new Error('Failed to create prompt: No data returned');
      }
    } catch (e: any) {
      error.value = e.message;
      throw e;
    }
  };

  return { prompts, loading, error, fetchActivePrompts, createPrompt, fetchPromptById };
});
