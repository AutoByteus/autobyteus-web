<template>
  <div class="h-full flex flex-col overflow-hidden">
    <div class="flex items-center justify-between px-8 pt-8 pb-4 flex-shrink-0">
      <h2 class="text-xl font-semibold text-gray-900">Node Manager</h2>
    </div>

    <div class="flex-1 overflow-auto p-8 space-y-6">
      <section class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 class="text-sm font-semibold text-blue-800">Current Window Node</h3>
        <p class="mt-2 text-sm text-blue-900">
          {{ currentNode?.name || 'Unknown Node' }}
          <span class="ml-2 text-xs uppercase tracking-wide px-2 py-0.5 rounded bg-blue-100 text-blue-700">
            {{ currentNode?.nodeType || 'unknown' }}
          </span>
        </p>
        <p v-if="currentNode?.baseUrl" class="mt-1 text-xs text-blue-700 font-mono">
          {{ currentNode.baseUrl }}
        </p>
      </section>

      <section class="border border-gray-200 rounded-lg p-4">
        <h3 class="text-sm font-semibold text-gray-900">Add Remote Node</h3>
        <p class="text-xs text-gray-500 mt-1">
          Adding a node opens a dedicated window for that node.
        </p>

        <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            v-model="addForm.name"
            type="text"
            placeholder="Node Name"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            data-testid="node-name-input"
          />
          <input
            v-model="addForm.baseUrl"
            type="text"
            placeholder="http://host:port"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
            data-testid="node-url-input"
          />
        </div>

        <div class="mt-3 flex items-center gap-2">
          <button
            class="px-4 py-2 rounded-md bg-blue-600 text-white text-sm disabled:opacity-50"
            :disabled="isAdding"
            @click="onAddRemoteNode"
            data-testid="add-node-button"
          >
            {{ isAdding ? 'Adding...' : 'Add Node' }}
          </button>
        </div>

        <p v-if="addError" class="mt-2 text-sm text-red-600" data-testid="add-node-error">
          {{ addError }}
        </p>
        <p v-if="addInfo" class="mt-2 text-sm text-blue-600" data-testid="add-node-info">
          {{ addInfo }}
        </p>
        <ul v-if="addWarnings.length > 0" class="mt-2 text-xs text-amber-700 list-disc list-inside">
          <li v-for="warning in addWarnings" :key="warning">{{ warning }}</li>
        </ul>
      </section>

      <section class="border border-gray-200 rounded-lg overflow-hidden">
        <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 class="text-sm font-semibold text-gray-900">Configured Nodes</h3>
        </div>

        <div class="divide-y divide-gray-200">
          <div
            v-for="node in nodeStore.nodes"
            :key="node.id"
            class="px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
          >
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <input
                  v-model="renameDrafts[node.id]"
                  :disabled="node.nodeType === 'embedded' || busyNodeId === node.id"
                  class="w-full md:max-w-sm rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  :data-testid="`node-name-${node.id}`"
                />
                <span class="text-xs uppercase tracking-wide px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                  {{ node.nodeType }}
                </span>
                <span
                  class="text-xs px-2 py-0.5 rounded"
                  :class="{
                    'bg-green-100 text-green-700': node.capabilityProbeState === 'ready',
                    'bg-amber-100 text-amber-700': node.capabilityProbeState === 'degraded',
                    'bg-gray-100 text-gray-700': !node.capabilityProbeState || node.capabilityProbeState === 'unknown',
                  }"
                >
                  {{ node.capabilityProbeState || 'unknown' }}
                </span>
              </div>
              <p class="mt-1 text-xs text-gray-500 font-mono break-all">{{ node.baseUrl }}</p>
            </div>

            <div class="flex items-center gap-2">
              <button
                class="px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                @click="onFocusNode(node.id)"
                :disabled="busyNodeId === node.id"
                :data-testid="`focus-node-${node.id}`"
              >
                Open
              </button>
              <button
                v-if="node.nodeType === 'remote'"
                class="px-3 py-1.5 rounded-md border border-blue-300 text-sm text-blue-700 hover:bg-blue-50"
                @click="onRenameNode(node.id)"
                :disabled="busyNodeId === node.id"
                :data-testid="`rename-node-${node.id}`"
              >
                Rename
              </button>
              <button
                v-if="node.nodeType === 'remote'"
                class="px-3 py-1.5 rounded-md border border-red-300 text-sm text-red-700 hover:bg-red-50"
                @click="onRemoveRemoteNode(node.id)"
                :disabled="busyNodeId === node.id"
                :data-testid="`remove-node-${node.id}`"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useNodeStore } from '~/stores/nodeStore';
import { useWindowNodeContextStore } from '~/stores/windowNodeContextStore';
import { probeNodeCapabilities } from '~/utils/nodeCapabilityProbe';
import { validateServerHostConfiguration } from '~/utils/nodeHostValidation';

const nodeStore = useNodeStore();
const windowNodeContextStore = useWindowNodeContextStore();

const addForm = reactive({
  name: '',
  baseUrl: '',
});

const renameDrafts = reactive<Record<string, string>>({});
const isAdding = ref(false);
const busyNodeId = ref<string | null>(null);
const addError = ref<string | null>(null);
const addInfo = ref<string | null>(null);
const addWarnings = ref<string[]>([]);

const currentNode = computed(() => nodeStore.getNodeById(windowNodeContextStore.nodeId));

function syncRenameDrafts(): void {
  const currentIds = new Set(nodeStore.nodes.map((node) => node.id));
  for (const node of nodeStore.nodes) {
    if (!renameDrafts[node.id]) {
      renameDrafts[node.id] = node.name;
    }
  }
  for (const nodeId of Object.keys(renameDrafts)) {
    if (!currentIds.has(nodeId)) {
      delete renameDrafts[nodeId];
    }
  }
}

async function onAddRemoteNode(): Promise<void> {
  if (isAdding.value) {
    return;
  }

  addError.value = null;
  addInfo.value = null;
  addWarnings.value = [];

  isAdding.value = true;
  try {
    const hostValidation = validateServerHostConfiguration(addForm.baseUrl);
    addWarnings.value = hostValidation.warnings.map((warning) => warning.message);

    const probeResult = await probeNodeCapabilities(hostValidation.normalizedBaseUrl, {
      timeoutMs: 1500,
    });

    await nodeStore.addRemoteNode({
      name: addForm.name,
      baseUrl: hostValidation.normalizedBaseUrl,
      capabilities: probeResult.capabilities,
      capabilityProbeState: probeResult.state,
    });

    if (probeResult.state !== 'ready') {
      addInfo.value =
        'Node added, but capability probe is degraded. Some optional features may stay disabled until the node is reachable.';
    } else if (addWarnings.value.length > 0) {
      addInfo.value = 'Node added with host warnings. Review generated URL behavior on this node.';
    } else {
      addInfo.value = 'Node added successfully.';
    }

    addForm.name = '';
    addForm.baseUrl = '';
    syncRenameDrafts();
  } catch (error) {
    addError.value = error instanceof Error ? error.message : String(error);
  } finally {
    isAdding.value = false;
  }
}

async function onFocusNode(nodeId: string): Promise<void> {
  if (window.electronAPI?.openNodeWindow) {
    await window.electronAPI.openNodeWindow(nodeId);
  }
}

async function onRenameNode(nodeId: string): Promise<void> {
  if (busyNodeId.value) {
    return;
  }

  const nextName = renameDrafts[nodeId]?.trim() || '';
  const node = nodeStore.getNodeById(nodeId);
  if (!node) {
    return;
  }
  if (!nextName || nextName === node.name) {
    renameDrafts[nodeId] = node.name;
    return;
  }

  busyNodeId.value = nodeId;
  try {
    await nodeStore.renameNode(nodeId, nextName);
  } catch (error) {
    addError.value = error instanceof Error ? error.message : String(error);
    renameDrafts[nodeId] = node.name;
  } finally {
    busyNodeId.value = null;
  }
}

async function onRemoveRemoteNode(nodeId: string): Promise<void> {
  if (busyNodeId.value) {
    return;
  }

  const node = nodeStore.getNodeById(nodeId);
  if (!node || node.nodeType !== 'remote') {
    return;
  }

  const confirmed = window.confirm(`Remove node "${node.name}"?`);
  if (!confirmed) {
    return;
  }

  busyNodeId.value = nodeId;
  try {
    await nodeStore.removeRemoteNode(nodeId);
  } catch (error) {
    addError.value = error instanceof Error ? error.message : String(error);
  } finally {
    busyNodeId.value = null;
  }
}

watch(
  () => nodeStore.nodes,
  () => {
    syncRenameDrafts();
  },
  { deep: true },
);

onMounted(async () => {
  await nodeStore.initializeRegistry();
  syncRenameDrafts();
});
</script>
