<template>
  <div 
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="close"
  >
    <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
      <h2 class="text-2xl font-bold mb-4">Conversation History</h2>

      <!-- Search Bar -->
      <div class="flex items-center space-x-2 mb-4">
        <input
          type="text"
          v-model="localSearchQuery"
          @keyup.enter="handleSearch"
          placeholder="Search conversations..."
          class="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
        />
        <button 
          @click="handleSearch" 
          class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200"
        >
          Search
        </button>
        <button 
          @click="handleClear" 
          class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200"
        >
          Clear
        </button>
      </div>

      <div class="flex-grow overflow-y-auto">
        <div v-if="conversationHistoryStore.loading" class="text-center">
          <p>Loading...</p>
        </div>
        <div v-else-if="panelConversations.length > 0">
          <ConversationList
            :conversations="panelConversations"
            :activeConversationId="null" 
            @activate="handleActivateConversation"
            @delete="handleDeleteConversation"
          />
        </div>
        <div v-else class="text-center text-gray-500 py-8">
          <p>No conversations found.</p>
        </div>
      </div>
      
      <div v-if="panelConversations.length > 0" class="flex justify-between items-center mt-4 flex-shrink-0">
        <button 
          @click="previousPage" 
          :disabled="conversationHistoryStore.isFirstPage"
          class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50"
        >
          Previous
        </button>
        <span>Page {{ conversationHistoryStore.getCurrentPage }} of {{ conversationHistoryStore.getTotalPages }}</span>
        <button 
          @click="nextPage" 
          :disabled="conversationHistoryStore.isLastPage"
          class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50"
        >
          Next
        </button>
      </div>
      
      <div v-if="conversationHistoryStore.error" class="mt-4 text-red-500">
        <p>{{ conversationHistoryStore.error }}</p>
      </div>
      
      <button 
        @click="close"
        class="mt-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200 self-center"
      >
        Close
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useConversationHistoryStore } from '~/stores/conversationHistory';
import { useAgentContextsStore } from '~/stores/agentContextsStore';
import ConversationList from '~/components/conversation/ConversationList.vue';
import { useAgentLaunchProfileStore } from '~/stores/agentLaunchProfileStore';
import { useAgentDefinitionStore } from '~/stores/agentDefinitionStore';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const conversationHistoryStore = useConversationHistoryStore();
const agentContextsStore = useAgentContextsStore();
const agentLaunchProfileStore = useAgentLaunchProfileStore();
const agentDefinitionStore = useAgentDefinitionStore();

const localSearchQuery = ref('');

const panelConversations = computed(() => conversationHistoryStore.getConversations);

const handleActivateConversation = (conversationId: string) => {
  const conversationToLoad = panelConversations.value.find(conv => conv.id === conversationId);
  if (conversationToLoad) {
    // --- CONTEXT SWITCH ORCHESTRATION ---
    // Ensure a suitable single-agent launch profile is active before creating the context.
    const agentDefId = conversationToLoad.agentDefinitionId;
    let activeProfile = agentLaunchProfileStore.activeLaunchProfile;

    // Check if we need to switch or create a new profile. This is the case if no profile is active,
    // or if the active one is for a different agent definition.
    if (!activeProfile || activeProfile.agentDefinition.id !== agentDefId) {
      // Look for an existing, active profile that matches the agent definition of the historical conversation.
      const suitableProfile = agentLaunchProfileStore.activeLaunchProfileList.find(
        p => p.agentDefinition.id === agentDefId
      );

      if (suitableProfile) {
        // A suitable profile exists, so we just need to activate it.
        // This will switch the app's context to 'agent' mode.
        agentLaunchProfileStore.setActiveLaunchProfile(suitableProfile.id);
      } else {
        // No suitable active profile found. We'll create a new, temporary, workspace-less profile.
        const agentDef = agentDefinitionStore.getAgentDefinitionById(agentDefId);
        if (agentDef) {
          console.log(`No active launch profile for ${agentDef.name}. Creating a new temporary one to view history.`);
          const newProfile = agentLaunchProfileStore.createLaunchProfile(
            agentDef,
            null, // workspaceId (this makes it a "workspace-less" profile)
            'No Workspace',
            'No Workspace',
            {}
          );
          // Activating the new profile will switch the app's context to 'agent' mode.
          agentLaunchProfileStore.setActiveLaunchProfile(newProfile.id);
        } else {
          console.error(`Could not find Agent Definition for ID: ${agentDefId} when trying to load conversation from history.`);
          // Abort the operation if the agent definition is missing.
          return;
        }
      }
    }
    
    // Now that the application context is guaranteed to be correct, we can safely load the history.
    agentContextsStore.createContextFromHistory(conversationToLoad);
    
  } else {
    console.error(`Failed to find conversation with ID ${conversationId} in history panel.`);
  }
  close();
};

const handleDeleteConversation = (conversationId: string) => {
  console.log(`Request to delete conversation with ID: ${conversationId} from history (not implemented).`);
};

const previousPage = async () => {
  await conversationHistoryStore.previousPage();
};

const nextPage = async () => {
  await conversationHistoryStore.nextPage();
};

const handleSearch = () => {
  conversationHistoryStore.performSearch(localSearchQuery.value);
};

const handleClear = () => {
  localSearchQuery.value = '';
  conversationHistoryStore.clearSearch();
};

const close = () => {
  emit('close');
};
</script>

<style scoped>
/* Add any additional styles here */
</style>
