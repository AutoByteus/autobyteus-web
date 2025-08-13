<template>
  <div class="flex h-screen bg-gray-100">
    <ToolsSidebar :active-page="activeView" @navigate="handleNavigation" />

    <main class="flex-1 p-8 overflow-y-auto">
      <!-- Local Tools View -->
      <div v-if="activeView === 'local-tools'">
        <ToolsFilter 
          v-model:searchQuery="searchQuery"
          v-model:selectedCategory="selectedCategory"
          :categories="localToolCategories"
          :show-category-filter="true"
        />
        <div v-if="store.getLoading && store.getLocalToolsByCategory.length === 0" class="text-center py-20">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p>Loading tools...</p>
        </div>
        <div v-else-if="filteredLocalToolsByCategory.length === 0" class="text-center py-16 bg-white rounded-lg border">
          <p class="text-lg font-medium text-gray-700">No tools found</p>
          <p class="text-sm text-gray-500 mt-1">Try adjusting your search or filter.</p>
        </div>
        <div v-else class="space-y-8">
          <ToolList 
            v-for="group in filteredLocalToolsByCategory"
            :key="group.categoryName"
            :title="group.categoryName"
            :tools="group.tools"
            :loading="false" 
            source="Local"
            @details="showToolDetails"
          />
        </div>
      </div>

      <!-- MCP Servers List View -->
      <div v-else-if="activeView === 'mcp-servers'">
        <ToolsFilter 
          v-model:searchQuery="searchQuery" 
          :show-category-filter="false" 
        />
        <McpServerList
          :servers="filteredMcpServers"
          :loading="store.getLoading && activeView.startsWith('mcp-')"
          @add="showAddServerForm"
          @edit="showEditServerForm"
          @delete="requestDeleteServer"
          @bulk-import="showBulkImportView"
          @discover-tools="discoverTools"
          @view-tools="viewToolsForServer"
        />
      </div>
      
      <!-- MCP Server Form View (Add/Edit) -->
      <div v-else-if="activeView === 'mcp-form'">
        <McpServerFormModal
          :server="selectedServer"
          @cancel="handleNavigation('mcp-servers')"
          @save-complete="handleServerSave"
          @show-toast="handleShowToast"
        />
      </div>

      <!-- MCP Bulk Import View -->
      <div v-else-if="activeView === 'mcp-bulk-import'">
        <McpBulkImportView
          @cancel="handleNavigation('mcp-servers')"
          @save-complete="handleNavigation('mcp-servers')"
          @show-toast="handleShowToast"
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
          empty-icon="i-heroicons-puzzle-piece-20-solid"
          empty-message="No tools registered for this server. Try syncing tools."
          @back="handleNavigation('mcp-servers')"
          @details="showToolDetails"
        />
      </div>
    </main>

    <!-- Modals & Notifications -->
    <ToastContainer />

    <ToolDetailsModal
      :show="isToolDetailVisible"
      :tool="selectedTool"
      @close="isToolDetailVisible = false"
    />

    <ToolsConfirmationModal 
        :show="isDeleteConfirmVisible"
        title="Delete MCP Server"
        :message="`Are you sure you want to delete the server '<strong>${serverToDeleteId}</strong>'?<br>This action cannot be undone.`"
        confirm-button-text="Delete"
        variant="danger"
        @confirm="executeDeleteServer"
        @cancel="cancelDeleteServer"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useToolManagementStore } from '~/stores/toolManagementStore';
import type { Tool, McpServer, ToolCategoryGroup } from '~/stores/toolManagementStore';
import { useToasts, type ToastType } from '~/composables/useToasts';

import ToolsSidebar from '~/components/tools/ToolsSidebar.vue';
import ToolList from '~/components/tools/ToolList.vue';
import ToolDetailsModal from '~/components/tools/ToolDetailsModal.vue';
import McpServerList from '~/components/tools/McpServerList.vue';
import McpServerFormModal from '~/components/tools/McpServerFormModal.vue';
import McpBulkImportView from '~/components/tools/McpBulkImportView.vue';
import ToolsFilter from '~/components/tools/ToolsFilter.vue';
import ToastContainer from '~/components/common/ToastContainer.vue';
import ToolsConfirmationModal from '~/components/tools/ToolsConfirmationModal.vue';

const store = useToolManagementStore();
const { addToast } = useToasts();

// --- State ---
const activeView = ref('local-tools');
const isToolDetailVisible = ref(false);
const isDeleteConfirmVisible = ref(false);
const selectedTool = ref<Tool | null>(null);
const selectedServer = ref<McpServer | null>(null);
const serverToDeleteId = ref<string | null>(null);
const searchQuery = ref('');
const selectedCategory = ref('All Categories');

const currentServerId = computed(() => {
  if (activeView.value.startsWith('mcp-tools-')) {
    return activeView.value.replace('mcp-tools-', '');
  }
  return null;
});

// --- Filtering Logic ---
const localToolCategories = computed(() => {
  const categories = store.getLocalToolsByCategory.map(group => group.categoryName);
  return ['All Categories', ...categories.sort()];
});

const filteredLocalToolsByCategory = computed(() => {
  let groups = store.getLocalToolsByCategory;
  if (selectedCategory.value !== 'All Categories') {
    groups = groups.filter(group => group.categoryName === selectedCategory.value);
  }
  if (!searchQuery.value) return groups;
  const query = searchQuery.value.toLowerCase();
  return groups.reduce((acc: ToolCategoryGroup[], group) => {
    const filteredTools = group.tools.filter(tool => 
      tool.name.toLowerCase().includes(query) || tool.description.toLowerCase().includes(query)
    );
    if (filteredTools.length > 0) acc.push({ ...group, tools: filteredTools });
    return acc;
  }, []);
});

const filteredMcpServers = computed(() => {
  if (!searchQuery.value) return store.getMcpServers;
  const query = searchQuery.value.toLowerCase();
  return store.getMcpServers.filter(server => server.serverId.toLowerCase().includes(query));
});

// --- Lifecycle ---
onMounted(() => {
  store.fetchLocalToolsGroupedByCategory();
  store.fetchMcpServers();
});

// --- Methods ---
const handleNavigation = (view: string) => {
  activeView.value = view;
  searchQuery.value = '';
  selectedCategory.value = 'All Categories';
  if (view === 'local-tools') store.fetchLocalToolsGroupedByCategory();
  else if (view === 'mcp-servers') store.fetchMcpServers();
};

const handleShowToast = (payload: { message: string, type: ToastType }) => {
  addToast(payload.message, payload.type);
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

const showBulkImportView = () => {
  activeView.value = 'mcp-bulk-import';
};

const viewToolsForServer = (serverId: string) => {
  activeView.value = `mcp-tools-${serverId}`;
  store.fetchToolsForServer(serverId);
};

const handleServerSave = (payload: { serverId: string; didSync: boolean }) => {
  if (payload.didSync) {
    viewToolsForServer(payload.serverId);
  } else {
    handleNavigation('mcp-servers');
  }
};

const requestDeleteServer = (serverId: string) => {
  serverToDeleteId.value = serverId;
  isDeleteConfirmVisible.value = true;
};

const cancelDeleteServer = () => {
  serverToDeleteId.value = null;
  isDeleteConfirmVisible.value = false;
};

const executeDeleteServer = async () => {
  if (serverToDeleteId.value) {
    try {
      const result = await store.deleteMcpServer(serverToDeleteId.value);
      addToast(result.message, result.success ? 'success' : 'error');
    } catch(e: any) {
      addToast(`Failed to delete server: ${e.message}`, 'error');
    } finally {
      cancelDeleteServer();
    }
  }
};

const discoverTools = async (serverId: string) => {
    addToast(`Syncing tools for '${serverId}'...`, 'info');
    try {
        const result = await store.discoverAndRegisterMcpServerTools(serverId);
        addToast(result.message, result.success ? 'success' : 'error');
        if (result.success) {
            viewToolsForServer(serverId);
        }
    } catch(e: any) {
        addToast(`An unexpected error occurred: ${e.message}`, 'error');
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
