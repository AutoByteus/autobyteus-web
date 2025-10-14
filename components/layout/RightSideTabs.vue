<template>
  <div class="flex flex-col h-full bg-white pt-2">
    <TabList
      :tabs="visibleTabs"
      :selected-tab="activeTab"
      @select="handleTabSelect"
    />

    <!-- Tab Content -->
    <div class="flex-grow overflow-auto relative mt-[-1px]">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useSelectedLaunchProfileStore } from '~/stores/selectedLaunchProfileStore';
import { useActiveContextStore } from '~/stores/activeContextStore';
import TabList from '~/components/tabs/TabList.vue';
import TeamOverviewPanel from '~/components/workspace/TeamOverviewPanel.vue';
import TodoListPanel from '~/components/workspace/TodoListPanel.vue';
import Terminal from '~/components/workspace/Terminal.vue';
import VncViewer from '~/components/workspace/VncViewer.vue';

type TabName = 'teamMembers' | 'terminal' | 'vnc' | 'todoList';

const selectedLaunchProfileStore = useSelectedLaunchProfileStore();
const activeContextStore = useActiveContextStore();
const activeTab = ref<TabName>('terminal');

const allTabs = [
  { name: 'teamMembers' as TabName, label: 'Team', requires: 'team' },
  { name: 'todoList' as TabName, label: 'To-Do', requires: 'agent' },
  { name: 'terminal' as TabName, label: 'Terminal', requires: 'any' },
  { name: 'vnc' as TabName, label: 'VNC Viewer', requires: 'any' },
];

const visibleTabs = computed(() => {
  return allTabs.filter(tab => {
    if (tab.requires === 'any') return true;
    return tab.requires === selectedLaunchProfileStore.selectedProfileType;
  });
});

const handleTabSelect = (tabName: string) => {
  activeTab.value = tabName as TabName;
};

// Watch for changes in the selected profile type to adjust the active tab
watch(() => selectedLaunchProfileStore.selectedProfileType, (newType) => {
  if (newType === 'team') {
    activeTab.value = 'teamMembers';
  } else if (newType === 'agent') {
    // If the new profile type is 'agent', switch to the 'todoList' tab by default.
    // If the todo list is empty, the panel will show a "no todos" message.
    activeTab.value = 'todoList';
  }
}, { immediate: true });

// Watch for changes in visible tabs to ensure the active tab is always valid
watch(visibleTabs, (newVisibleTabs) => {
  const isCurrentTabVisible = newVisibleTabs.some(tab => tab.name === activeTab.value);
  if (!isCurrentTabVisible && newVisibleTabs.length > 0) {
    activeTab.value = newVisibleTabs[0].name;
  }
});

// Watch the ToDo list for the active agent. If it becomes populated, switch to the To-Do tab.
watch(() => activeContextStore.currentTodoList, (newTodoList) => {
  if (selectedLaunchProfileStore.selectedProfileType === 'agent' && newTodoList.length > 0 && activeTab.value !== 'todoList') {
    activeTab.value = 'todoList';
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
