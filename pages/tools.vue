<template>
  <div class="flex h-screen bg-gray-100">
    <ToolsSidebar :active-page="activeView" @navigate="handleNavigation" />

    <main class="flex-1 p-8 overflow-y-auto">
      <!-- Local Tools View -->
      <div v-if="activeView === 'local-tools'">
        <ToolList 
          title="Local Tools"
          :tools="store.getLocalTools"
          :loading="store.getLoading && activeView === 'local-tools'"
          source="Local"
          @details="showToolDetails"
        />
      </div>

      <!-- MCP Servers List View -->
      <div v-else-if="activeView === 'mcp-servers'">
        <McpServerList
          :servers="store.getMcpServers"
          :loading="store.getLoading && activeView.startsWith('mcp-')"
          @add="showAddServerForm"
          @edit="showEditServerForm"
          @delete="confirmDeleteServer"
          @view-tools="viewToolsForServer"
        />
      </div>
      
      <!-- MCP Server Form View (Add/Edit) -->
      <div v-else-if="activeView === 'mcp-form'">
        <McpServerFormModal
          :server="selectedServer"
          @cancel="handleNavigation('mcp-servers')"
          @save="handleServerSave"
        />
      </div>

      <!-- Tools for a specific MCP Server -->
      <div v-else-if="activeView.startsWith('mcp-tools-')">
         <ToolList
          :title="`Tools for ${currentServerId}`"
          :tools="store.getToolsForServer(currentServerId!)"
          :loading="store.getLoading && activeView === `mcp-tools-${currentServerId}`"
          :source="currentServerId!"
          show-back-button
          @back="handleNavigation('mcp-servers')"
          @details="showToolDetails"
        />
      </div>
    </main>

    <!-- Modals -->
    <ToolDetailsModal
      :show="isToolDetailVisible"
      :tool="selectedTool"
      @close="isToolDetailVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useToolManagementStore } from '~/stores/toolManagementStore';
import type { Tool, McpServer } from '~/stores/toolManagementStore';

import ToolsSidebar from '~/components/tools/ToolsSidebar.vue';
import ToolList from '~/components/tools/ToolList.vue';
import ToolDetailsModal from '~/components/tools/ToolDetailsModal.vue';
import McpServerList from '~/components/tools/McpServerList.vue';
import McpServerFormModal from '~/components/tools/McpServerFormModal.vue';

const store = useToolManagementStore();

// --- State ---
const activeView = ref('local-tools'); // 'local-tools', 'mcp-servers', 'mcp-form', 'mcp-tools-<serverId>'
const isToolDetailVisible = ref(false);
const selectedTool = ref<Tool | null>(null);
const selectedServer = ref<McpServer | null>(null);

const currentServerId = computed(() => {
  if (activeView.value.startsWith('mcp-tools-')) {
    return activeView.value.replace('mcp-tools-', '');
  }
  return null;
});

// --- Lifecycle ---
onMounted(() => {
  store.fetchLocalTools();
  store.fetchMcpServers();
});

// --- Methods ---
const handleNavigation = (view: string) => {
  activeView.value = view;
  if (view === 'local-tools') {
    store.fetchLocalTools();
  } else if (view === 'mcp-servers') {
    store.fetchMcpServers();
  }
};

const showToolDetails = (tool: Tool) => {
  selectedTool.value = tool;
  isToolDetailVisible.value = true;
};

const showAddServerForm = () => {
  selectedServer.value = null;
  activeView.value = 'mcp-form';
};

const showEditServerForm = (server: McpServer) => {
  selectedServer.value = server;
  activeView.value = 'mcp-form';
};

const viewToolsForServer = (serverId: string) => {
  activeView.value = `mcp-tools-${serverId}`;
  store.fetchToolsForServer(serverId);
};

const handleServerSave = () => {
  activeView.value = 'mcp-servers';
};

const confirmDeleteServer = async (serverId: string) => {
  if (confirm(`Are you sure you want to delete the server "${serverId}"? This cannot be undone.`)) {
    try {
      await store.deleteMcpServer(serverId);
      alert(`Server ${serverId} deleted successfully.`);
      // The store action now handles refetching, so no need to call it here.
    } catch(e: any) {
      alert(`Failed to delete server: ${e.message}`);
    }
  }
};
</script>

<style>
/* To ensure full height layout */
html, body, #__nuxt {
  height: 100%;
  margin: 0;
}
</style>
