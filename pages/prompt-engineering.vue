<template>
  <div class="flex h-full bg-gray-50">
    <!-- Left Sidebar -->
    <PromptSidebar
      title="Prompt Engineering"
      :menuItems="menuItems"
      :currentView="currentView"
      @navigate="navigateTo"
    />
    
    <!-- Main Content Area -->
    <div class="flex-1 p-6 overflow-auto">
      <!-- Marketplace View -->
      <transition name="fade" mode="out-in">
        <div v-if="currentView === 'marketplace' && !selectedPromptId">
          <PromptMarketplace 
            :selectedPromptId="selectedPromptId"
            @select-prompt="handlePromptSelect"
          />
        </div>
      </transition>

      <!-- Prompt Details View -->
      <transition name="fade" mode="out-in">
        <PromptDetails 
          v-if="selectedPromptId" 
          :promptId="selectedPromptId"
          @close="closePromptDetails"
        />
      </transition>
      
      <!-- Generation View -->
      <transition name="fade" mode="out-in">
        <div v-if="currentView === 'generation'">
          <h1 class="text-2xl font-bold mb-6">Prompt Generation</h1>
          <!-- Future prompt generation implementation will go here -->
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PromptMarketplace from '~/components/promptEngineering/PromptMarketplace.vue';
import PromptDetails from '~/components/promptEngineering/PromptDetails.vue';
import PromptSidebar from '~/components/promptEngineering/PromptSidebar.vue';

const currentView = ref('marketplace');
const selectedPromptId = ref<string | null>(null);

const menuItems = [
  { id: 'marketplace', label: 'Prompts Marketplace' },
  { id: 'generation', label: 'Prompt Generation' }
];

function navigateTo(view: string) {
  // If we're viewing a prompt detail, close it first
  if (selectedPromptId.value) {
    selectedPromptId.value = null;
  }
  currentView.value = view;
}

function handlePromptSelect(id: string) {
  selectedPromptId.value = id;
}

function closePromptDetails() {
  selectedPromptId.value = null;
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
