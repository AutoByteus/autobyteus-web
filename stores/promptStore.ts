import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useApolloClient, useMutation } from '@vue/apollo-composable';
import { GET_PROMPTS, GET_PROMPT_BY_ID } from '~/graphql/queries/prompt_queries';
import { CREATE_PROMPT, UPDATE_PROMPT, ADD_NEW_PROMPT_REVISION, SYNC_PROMPTS, DELETE_PROMPT, MARK_ACTIVE_PROMPT } from '~/graphql/mutations/prompt_mutations';
import { GetAgentCustomizationOptions } from '~/graphql/queries/agentCustomizationOptionsQueries';

interface Prompt {
  __typename?: 'Prompt';
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
  isForAgentTeam: boolean; // Note: schema says isForAgentTeam, not isForWorkflow
}

interface SyncResult {
  __typename?: 'SyncResult';
  success: boolean;
  message: string;
  initialCount: number;
  finalCount: number;
  syncedCount: number;
}

interface DeleteResult {
  __typename?: 'DeleteResult';
  success: boolean;
  message: string;
}

export const usePromptStore = defineStore('prompt', () => {
  const { client } = useApolloClient();

  // State
  const prompts = ref<Prompt[]>([]);
  const loading = ref(false);
  const error = ref('');
  const selectedPrompt = ref<Prompt | null>(null);
  const syncing = ref(false);
  const syncResult = ref<SyncResult | null>(null);
  const deleteResult = ref<DeleteResult | null>(null);

  // Actions
  async function fetchPrompts(isActive: boolean | null = null) {
    if (prompts.value.length > 0) return; // Data already exists, rely on cache.
    loading.value = true;
    error.value = '';

    try {
      const { data, errors } = await client.query({
        query: GET_PROMPTS,
        variables: { isActive },
        // Uses default 'cache-first'
      });

      if (errors && errors.length > 0) {
        throw new Error(errors.map((e) => e.message).join(', '));
      }

      if (data?.prompts) {
        prompts.value = data.prompts;
      }
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function reloadPrompts() {
    loading.value = true;
    error.value = '';

    try {
      const { data, errors } = await client.query({
        query: GET_PROMPTS,
        variables: { isActive: null },
        fetchPolicy: 'network-only', // Force network request to bypass cache
      });

      if (errors && errors.length > 0) {
        throw new Error(errors.map((e) => e.message).join(', '));
      }

      if (data?.prompts) {
        prompts.value = data.prompts;
      }
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function fetchPromptById(id: string): Promise<Prompt | null> {
    loading.value = true;
    error.value = '';

    try {
      const { data, errors } = await client.query({
        query: GET_PROMPT_BY_ID,
        variables: { id },
        // Uses default 'cache-first'
      });

      if (errors && errors.length > 0) {
        throw new Error(errors.map((e) => e.message).join(', '));
      }
      
      loading.value = false;
      if (data?.promptDetails) {
        selectedPrompt.value = data.promptDetails;
        return data.promptDetails;
      } else {
        return null;
      }
    } catch (e: any) {
      error.value = e.message;
      loading.value = false;
      throw e;
    }
  }

  async function createPrompt(
    name: string,
    category: string,
    promptContent: string,
    description?: string,
    suitableForModels?: string,
    isForAgentTeam?: boolean,
  ) {
    try {
      const { mutate } = useMutation(CREATE_PROMPT, {
        refetchQueries: [
          { query: GET_PROMPTS },
          { query: GetAgentCustomizationOptions }
        ]
      });
      const response = await mutate({
        input: { name, category, promptContent, description, suitableForModels, isForAgentTeam },
      });

      if (response?.data?.createPrompt) {
        const newPrompt = response.data.createPrompt;
        prompts.value = [...prompts.value, newPrompt];
        return newPrompt;
      }
      throw new Error('Failed to create prompt: No data returned');
    } catch (e: any) {
      error.value = e.message;
      throw e;
    }
  }

  async function updatePrompt(
    id: string,
    promptContent?: string,
    description?: string,
    suitableForModels?: string,
    isActive?: boolean,
    name?: string,
    category?: string,
  ) {
    try {
      const { mutate } = useMutation(UPDATE_PROMPT, {
        refetchQueries: [{ query: GetAgentCustomizationOptions }]
      });
      const response = await mutate({
        input: { id, promptContent, description, suitableForModels, isActive, name, category },
      });

      if (response?.data?.updatePrompt) {
        const updatedPrompt = response.data.updatePrompt;
        const index = prompts.value.findIndex(p => p.id === updatedPrompt.id);
        if (index !== -1) {
          const newPrompts = [...prompts.value];
          newPrompts[index] = updatedPrompt;
          prompts.value = newPrompts;
        }
        return updatedPrompt;
      }
      throw new Error('Failed to update prompt: No data returned');
    } catch (e: any) {
      error.value = e.message;
      throw e;
    }
  }

  async function addNewPromptRevision(
    id: string,
    newPromptContent: string,
  ) {
    try {
      const { mutate } = useMutation(ADD_NEW_PROMPT_REVISION, {
        refetchQueries: [{ query: GET_PROMPTS }]
      });
      const response = await mutate({
        input: { id, newPromptContent },
      });

      if (response?.data?.addNewPromptRevision) {
        return response.data.addNewPromptRevision;
      }
      throw new Error('Failed to add new prompt revision: No data returned');
    } catch (e: any) {
      error.value = e.message;
      throw e;
    }
  }

  async function setActivePrompt(promptId: string) {
    try {
      const { mutate } = useMutation(MARK_ACTIVE_PROMPT, {
        refetchQueries: [{ query: GET_PROMPTS }]
      });
      const response = await mutate({ input: { id: promptId } });

      if (response?.data?.markActivePrompt) {
        return response.data.markActivePrompt;
      }
      throw new Error('Failed to mark prompt as active: No data returned');
    } catch (e: any) {
      error.value = e.message;
      throw e;
    }
  }

  async function syncPrompts() {
    syncing.value = true;
    error.value = '';
    syncResult.value = null;

    try {
      const { mutate } = useMutation(SYNC_PROMPTS, {
        refetchQueries: [
          { query: GET_PROMPTS },
          { query: GetAgentCustomizationOptions }
        ]
      });
      const response = await mutate();

      if (response?.data?.syncPrompts) {
        syncResult.value = response.data.syncPrompts;
        return syncResult.value;
      }
      throw new Error('Failed to sync prompts: No data returned');
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      syncing.value = false;
    }
  }

  async function deletePrompt(id: string) {
    loading.value = true;
    error.value = '';
    deleteResult.value = null;

    try {
      const { mutate } = useMutation(DELETE_PROMPT, {
        refetchQueries: [
          { query: GET_PROMPTS },
          { query: GetAgentCustomizationOptions }
        ]
      });
      const response = await mutate({
        input: { id },
      });

      if (response?.data?.deletePrompt) {
        deleteResult.value = response.data.deletePrompt;
        if (deleteResult.value.success) {
          prompts.value = prompts.value.filter(p => p.id !== id);
        }
        return deleteResult.value;
      }
      throw new Error('Failed to delete prompt: No data returned');
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function setSelectedPrompt(prompt: Prompt | null) {
    selectedPrompt.value = prompt;
  }

  function clearError() {
    error.value = '';
  }

  function clearSyncResult() {
    syncResult.value = null;
  }

  function clearDeleteResult() {
    deleteResult.value = null;
  }

  // Getters
  const getPrompts = computed(() => prompts.value);
  const getLoading = computed(() => loading.value);
  const getError = computed(() => error.value);
  const getSelectedPrompt = computed(() => selectedPrompt.value);
  const isSyncing = computed(() => syncing.value);
  const getSyncResult = computed(() => syncResult.value);
  const getDeleteResult = computed(() => deleteResult.value);

  return {
    // State refs
    prompts,
    loading,
    error,
    selectedPrompt,
    syncing,
    syncResult,
    deleteResult,
    // Actions
    fetchPrompts,
    reloadPrompts,
    fetchPromptById,
    createPrompt,
    updatePrompt,
    addNewPromptRevision,
    setActivePrompt,
    syncPrompts,
    deletePrompt,
    setSelectedPrompt,
    clearError,
    clearSyncResult,
    clearDeleteResult,
    // Getters
    getPrompts,
    getLoading,
    getError,
    getSelectedPrompt,
    isSyncing,
    getSyncResult,
    getDeleteResult,
  };
});
