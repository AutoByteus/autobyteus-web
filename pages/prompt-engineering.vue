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

        <!-- Create Prompt View -->
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
import { ref, computed } from 'vue';
import { usePromptEngineeringViewStore } from '~/stores/promptEngineeringViewStore';
import { storeToRefs } from 'pinia';

import PromptMarketplace from '~/components/promptEngineering/PromptMarketplace.vue';
import PromptDetails from '~/components/promptEngineering/PromptDetails.vue';
import PromptSidebar from '~/components/promptEngineering/PromptSidebar.vue';
import CreatePromptView from '~/components/promptEngineering/CreatePromptView.vue';

const viewStore = usePromptEngineeringViewStore();
const { currentView, selectedPromptId } = storeToRefs(viewStore);

// This is for the sidebar's active state, which is a bit different from the main content view
const sidebarView = ref('marketplace');

const menuItems = [
  { id: 'marketplace', label: 'Prompts Marketplace' },
];

function navigateTo(view: string) {
  sidebarView.value = view;
  if (view === 'marketplace') {
    // This will reset the view to marketplace and clear any selections
    viewStore.showMarketplace();
  }
}

// Watch for direct changes to selectedPromptId if needed, for example from URL routing in future
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
