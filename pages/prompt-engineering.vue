<template>
  <div class="flex h-full bg-gray-50">
    <!-- Left Sidebar -->
    <div class="w-64 bg-white shadow-sm">
      <div class="p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-6">Prompt Engineering</h2>
        <nav>
          <ul class="space-y-2">
            <li>
              <button 
                @click="currentView = 'marketplace'"
                class="w-full text-left px-4 py-2 rounded hover:bg-gray-100"
                :class="{'bg-gray-100 font-bold': currentView === 'marketplace'}"
              >
                Prompts Marketplace
              </button>
            </li>
            <li>
              <button 
                @click="currentView = 'generation'"
                class="w-full text-left px-4 py-2 rounded hover:bg-gray-100"
                :class="{'bg-gray-100 font-bold': currentView === 'generation'}"
              >
                Prompt Generation
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 p-6">
      <!-- Marketplace View -->
      <div v-if="currentView === 'marketplace'">
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold">Prompts Marketplace</h1>
          <button 
            @click="showModal = true" 
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Prompt
          </button>
        </div>

        <PromptMarketplace 
          :selectedPromptId="selectedPromptId"
          @select-prompt="handlePromptSelect"
        />
      </div>

      <!-- Generation View - Empty placeholder for now -->
      <div v-if="currentView === 'generation'">
        <h1 class="text-2xl font-bold mb-6">Prompt Generation</h1>
        <!-- Future prompt generation implementation will go here -->
      </div>
    </div>

    <!-- Prompt Details Side Panel -->
    <PromptDetails 
      v-if="selectedPromptId" 
      :promptId="selectedPromptId"
      @close="selectedPromptId = null"
    />

    <!-- Create Prompt Modal -->
    <CreatePromptModal v-if="showModal" @close="showModal = false" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PromptMarketplace from '~/components/promptEngineering/PromptMarketplace.vue';
import PromptDetails from '~/components/promptEngineering/PromptDetails.vue';
import CreatePromptModal from '~/components/promptEngineering/CreatePromptModal.vue';

const currentView = ref('marketplace');
const selectedPromptId = ref<string | null>(null);
const showModal = ref(false);

const handlePromptSelect = (id: string) => {
  selectedPromptId.value = id;
};
</script>
