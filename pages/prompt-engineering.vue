<template>
  <div class="flex h-full bg-gray-50">
    <!-- Left Sidebar -->
    <PromptSidebar
      title="Prompt Engineering"
      :menuItems="menuItems"
      :currentView="sidebarView"
      @navigate="navigateTo"
    />
    
    <!-- Main Content Area -->
    <div class="flex-1 p-6 overflow-auto">
      <transition name="fade" mode="out-in">
        <!-- Marketplace View -->
        <PromptMarketplace 
          v-if="viewStore.isMarketplaceView"
          :selectedPromptId="viewStore.selectedPromptId"
          @select-prompt="viewStore.showPromptDetails"
        />
        
        <!-- Drafts View -->
        <DraftsList 
          v-else-if="viewStore.isDraftsView"
        />

        <!-- Create Prompt View (Editor) -->
        <CreatePromptView
          v-else-if="viewStore.isCreateView"
        />

        <!-- Prompt Details View (Full Screen) -->
        <PromptDetails 
          v-else-if="viewStore.isDetailsView"
          :promptId="viewStore.selectedPromptId!"
        />
        
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePromptEngineeringViewStore } from '~/stores/promptEngineeringViewStore';

import PromptMarketplace from '~/components/promptEngineering/PromptMarketplace.vue';
import PromptDetails from '~/components/promptEngineering/PromptDetails.vue';
import PromptSidebar from '~/components/promptEngineering/PromptSidebar.vue';
import CreatePromptView from '~/components/promptEngineering/CreatePromptView.vue';
import DraftsList from '~/components/promptEngineering/DraftsList.vue';

const viewStore = usePromptEngineeringViewStore();

const menuItems = [
  { id: 'marketplace', label: 'Prompts Marketplace' },
  { id: 'drafts', label: 'My Drafts' },
];

// Sidebar logic: Uses the explicit context from the store
const sidebarView = computed(() => {
  return viewStore.currentSidebarContext;
});

function navigateTo(view: string) {
  if (view === 'marketplace') {
    viewStore.showMarketplace();
  } else if (view === 'drafts') {
    viewStore.showDraftsList();
  }
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
