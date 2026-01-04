<template>
  <div class="flex flex-col h-full bg-white">
    <!-- Header with Tabs and Toggle -->
    <div class="flex items-center justify-between bg-white pt-2 pr-1 border-b border-gray-200">
      <TabList
        class="flex-1"
        :tabs="visibleTabs"
        :selected-tab="activeTab"
        @select="handleTabSelect"
      />
      <button 
        @click="toggleRightPanel"
        class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors mr-2 flex-shrink-0"
        title="Toggle Sidebar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2"/>
          <path d="M15 3v18"/>
        </svg>
      </button>
    </div>

    <!-- Tab Content -->
    <div class="flex-grow overflow-auto relative">
      <div v-if="activeTab === 'files'" class="h-full">
        <FileExplorerLayout />
      </div>
      <div v-if="activeTab === 'teamMembers'" class="h-full">
        <TeamOverviewPanel />
      </div>
      <div v-if="activeTab === 'todoList'" class="h-full">
        <TodoListPanel :todos="activeContextStore.currentTodoList" />
      </div>
      <div v-if="activeTab === 'terminal'" class="h-full">
        <Terminal />
      </div>
      <div v-if="activeTab === 'vnc'" class="h-full">
        <VncViewer />
      </div>
      <div v-if="activeTab === 'artifacts'" class="h-full">
        <ArtifactsTab />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, computed } from 'vue';
import { useActiveContextStore } from '~/stores/activeContextStore';
import { useFileExplorerStore } from '~/stores/fileExplorer';
import { useRightPanel } from '~/composables/useRightPanel';
import { useRightSideTabs } from '~/composables/useRightSideTabs';
import { useSelectedLaunchProfileStore } from '~/stores/selectedLaunchProfileStore';
import TabList from '~/components/tabs/TabList.vue';
import TeamOverviewPanel from '~/components/workspace/team/TeamOverviewPanel.vue';
import TodoListPanel from '~/components/workspace/agent/TodoListPanel.vue';
import Terminal from '~/components/workspace/tools/Terminal.vue';
import VncViewer from '~/components/workspace/tools/VncViewer.vue';
import FileExplorerLayout from '~/components/fileExplorer/FileExplorerLayout.vue';
import ArtifactsTab from '~/components/workspace/agent/ArtifactsTab.vue';

const selectedLaunchProfileStore = useSelectedLaunchProfileStore();
const activeContextStore = useActiveContextStore();
const fileExplorerStore = useFileExplorerStore();
import { useAgentArtifactsStore } from '~/stores/agentArtifactsStore';
import { useAgentContextsStore } from '~/stores/agentContextsStore';
const artifactsStore = useAgentArtifactsStore();
const agentContextsStore = useAgentContextsStore();
const { toggleRightPanel } = useRightPanel();
const { activeTab, visibleTabs, setActiveTab } = useRightSideTabs();

const handleTabSelect = (tabName: string) => {
  setActiveTab(tabName as any);
};

// Watch for changes in the selected profile type to adjust the active tab via the composable logic
watch(() => selectedLaunchProfileStore.selectedProfileType, (newType) => {
  if (newType === 'team') {
    setActiveTab('teamMembers');
  } else if (newType === 'agent') {
    setActiveTab('todoList');
  }
}, { immediate: true });

// Watch for changes in visible tabs to ensure the active tab is always valid
watch(visibleTabs, (newVisibleTabs) => {
  const isCurrentTabVisible = newVisibleTabs.some(tab => tab.name === activeTab.value);
  if (!isCurrentTabVisible && newVisibleTabs.length > 0) {
    setActiveTab(newVisibleTabs[0].name);
  }
});

// Watch the ToDo list for the active agent. If it becomes populated, switch to the To-Do tab.
watch(() => activeContextStore.currentTodoList, (newTodoList) => {
  if (selectedLaunchProfileStore.selectedProfileType === 'agent' && newTodoList.length > 0 && activeTab.value !== 'todoList') {
    setActiveTab('todoList');
  }
});

// Auto-switch to Files tab when a file is opened
watch(() => fileExplorerStore.getOpenFiles, (openFiles) => {
  if (openFiles.length > 0 && activeTab.value !== 'files') {
    setActiveTab('files');
  }
}, { deep: true });

// Auto-switch to Artifacts tab when a new artifact starts streaming
const currentAgentId = computed(() => agentContextsStore.selectedAgentId || "");
watch(() => artifactsStore.getActiveStreamingArtifact(currentAgentId.value), (newArtifact) => {
  if (newArtifact && activeTab.value !== 'artifacts') {
    setActiveTab('artifacts');
  }
});

</script>

<style scoped>
/* Ensure content fills available space */
.flex-grow {
  display: flex;
  flex-direction: column;
}

.h-full {
  height: 100%;
}
</style>

