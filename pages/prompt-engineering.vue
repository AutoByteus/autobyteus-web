<template>
  <div class="flex h-full bg-gray-100">
    <!-- Sidebar -->
    <div class="w-64 bg-white shadow-sm">
      <div class="p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-6">Prompt Engineering</h2>
        <nav>
          <ul class="space-y-2">
            <li>
              <button 
                @click="activeSection = 'marketplace'"
                class="w-full text-left px-4 py-2 rounded hover:bg-gray-100"
                :class="{'bg-gray-100 font-bold': activeSection === 'marketplace'}"
              >
                Prompts Marketplace
              </button>
            </li>
            <!-- Future menu items can be added here -->
          </ul>
        </nav>
      </div>
    </div>
    <!-- Main Content -->
    <div class="flex-1 p-6">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-3xl font-bold">Prompts Marketplace</h1>
        <button @click="showModal = true" class="px-4 py-2 bg-blue-600 text-white rounded">
          Create Prompt
        </button>
      </div>
      <PromptMarketplace v-if="activeSection === 'marketplace'" />
      <!-- Modal Overlay -->
      <CreatePromptModal v-if="showModal" @close="showModal = false" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PromptMarketplace from '~/components/promptEngineering/PromptMarketplace.vue';
import CreatePromptModal from '~/components/promptEngineering/CreatePromptModal.vue';

const activeSection = ref('marketplace');
const showModal = ref(false);
</script>
