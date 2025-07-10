<template>
  <div class="flex h-screen bg-gray-100">
    <ToolsSidebar :active-page="activeView" @navigate="handleNavigation" />

    <main class="flex-1 p-8 overflow-y-auto">
      <!-- Local Tools View -->
      <div v-if="activeView === 'local-tools'">
        <ToolList 
          title="Local Tools"
          :tools="store.localTools"
          :loading="store.loading.localTools"
          source="Local"
          @details="showToolDetails"
        />
      </div>

      <!-- MCP Servers List View -->
      <div v-else-if="activeView === 'mcp-servers'">
        <McpServerList
          :servers="store.mcpServers"
          :loading="store.loading.mcpServers"
          @add="openAddServerModal"
          @edit="openEditServerModal"
          @delete="confirmDeleteServer"
          @view-tools="viewToolsForServer"
        />
      </div>
      
      <!-- Tools for a specific MCP Server -->
      <div v-else-if="activeView.startsWith('mcp-tools-')">
         <ToolList
          :title="`Tools for ${currentServerId}`"
          :tools="store.getToolsForServer(currentServerId)"
          :loading="store.isLoadingToolsForServer(currentServerId)"
          :source="currentServerId"
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
    <McpServerFormModal
      :show="isServerFormVisible"
      :server="selectedServer"
      @close="isServerFormVisible = false"
      @save="handleServerSave"
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
const activeView = ref('local-tools'); // 'local-tools', 'mcp-servers', 'mcp-tools-<serverId>'
const isToolDetailVisible = ref(false);
const selectedTool = ref<Tool | null>(null);
const isServerFormVisible = ref(false);
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
};

const showToolDetails = (tool: Tool) => {
  selectedTool.value = tool;
  isToolDetailVisible.value = true;
};

const openAddServerModal = () => {
  selectedServer.value = null;
  isServerFormVisible.value = true;
};

const openEditServerModal = (server: McpServer) => {
  selectedServer.value = server;
  isServerFormVisible.value = true;
};

const viewToolsForServer = (serverId: string) => {
  activeView.value = `mcp-tools-${serverId}`;
  store.fetchToolsForServer(serverId);
};

const handleServerSave = () => {
  isServerFormVisible.value = false;
  // Give a moment for backend to process before refetching
  setTimeout(() => {
    store.fetchMcpServers();
  }, 200);
};

const confirmDeleteServer = async (serverId: string) => {
  if (confirm(`Are you sure you want to delete the server "${serverId}"? This cannot be undone.`)) {
    await store.deleteMcpServer({ serverId });
    if (!store.deleteError) {
      alert(`Server ${serverId} deleted successfully.`);
      store.fetchMcpServers();
    } else {
      alert(`Failed to delete server: ${store.deleteError.message}`);
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
