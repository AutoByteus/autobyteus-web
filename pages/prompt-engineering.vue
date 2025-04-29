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
      <!-- Marketplace View - Removed duplicate header -->
      <div v-if="currentView === 'marketplace'">
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PromptMarketplace from '~/components/promptEngineering/PromptMarketplace.vue';
import PromptDetails from '~/components/promptEngineering/PromptDetails.vue';

const currentView = ref('marketplace');
const selectedPromptId = ref<string | null>(null);

const handlePromptSelect = (id: string) => {
  selectedPromptId.value = id;
};
</script>
