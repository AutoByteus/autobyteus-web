
import { ref, computed } from 'vue';
import { useSelectedLaunchProfileStore } from '~/stores/selectedLaunchProfileStore';

export type TabName = 'files' | 'teamMembers' | 'terminal' | 'vnc' | 'progress' | 'artifacts';

// Global state
const activeTab = ref<TabName>('terminal');

export function useRightSideTabs() {
  const selectedLaunchProfileStore = useSelectedLaunchProfileStore();

  const allTabs = [
    { name: 'files' as TabName, label: 'Files', requires: 'any' },
    { name: 'teamMembers' as TabName, label: 'Team', requires: 'team' },
    { name: 'terminal' as TabName, label: 'Terminal', requires: 'any' },
    { name: 'progress' as TabName, label: 'Progress', requires: 'agent' },
    { name: 'artifacts' as TabName, label: 'Artifacts', requires: 'agent' },
    { name: 'vnc' as TabName, label: 'VNC Viewer', requires: 'any' },
  ];

  const visibleTabs = computed(() => {
    return allTabs.filter(tab => {
      if (tab.requires === 'any') return true;
      return tab.requires === selectedLaunchProfileStore.selectedProfileType;
    });
  });

  const setActiveTab = (tab: TabName) => {
    activeTab.value = tab;
  };

  return {
    activeTab,
    visibleTabs,
    setActiveTab,
    allTabs // Exporting allTabs if needed for icons mapping
  };
}
