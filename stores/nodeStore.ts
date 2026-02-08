import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  EMBEDDED_NODE_ID,
  type NodeProfile,
  type NodeRegistryChange,
  type NodeRegistrySnapshot,
} from '~/types/node';
import { INTERNAL_SERVER_PORT } from '~/utils/serverConfig';
import { normalizeNodeBaseUrl } from '~/utils/nodeEndpoints';

function nowIsoString(): string {
  return new Date().toISOString();
}

function resolveDefaultEmbeddedBaseUrl(): string {
  const electronBaseUrl = `http://localhost:${INTERNAL_SERVER_PORT}`;
  if (typeof window !== 'undefined' && window.electronAPI) {
    return electronBaseUrl;
  }

  try {
    const config = useRuntimeConfig();
    const configuredBaseUrl = config.public.defaultNodeBaseUrl;
    if (typeof configuredBaseUrl === 'string' && configuredBaseUrl.trim()) {
      return normalizeNodeBaseUrl(configuredBaseUrl);
    }
  } catch {
    // Non-Nuxt contexts (unit tests) can fall back to the embedded default.
  }

  return electronBaseUrl;
}

function createEmbeddedNode(baseUrl: string): NodeProfile {
  const now = nowIsoString();
  return {
    id: EMBEDDED_NODE_ID,
    name: 'Embedded Node',
    baseUrl,
    nodeType: 'embedded',
    capabilities: {
      terminal: true,
      fileExplorerStreaming: true,
    },
    capabilityProbeState: 'ready',
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  };
}

function createDefaultSnapshot(baseUrl: string): NodeRegistrySnapshot {
  return {
    version: 1,
    nodes: [createEmbeddedNode(baseUrl)],
  };
}

function generateRemoteNodeId(): string {
  const randomId = globalThis.crypto?.randomUUID?.();
  return randomId ? `remote-${randomId}` : `remote-${Date.now()}`;
}

export const useNodeStore = defineStore('nodeStore', () => {
  const registryVersion = ref<number>(0);
  const nodes = ref<NodeProfile[]>([]);
  const listenerCleanup = ref<(() => void) | null>(null);
  const initialized = ref(false);
  const lastError = ref<string | null>(null);

  const nodeMap = computed(() => {
    const map = new Map<string, NodeProfile>();
    for (const node of nodes.value) {
      map.set(node.id, node);
    }
    return map;
  });

  const remoteNodes = computed(() => nodes.value.filter((node) => node.nodeType === 'remote'));

  function replaceSnapshot(snapshot: NodeRegistrySnapshot): void {
    registryVersion.value = snapshot.version;
    nodes.value = snapshot.nodes;
  }

  function applyRegistrySnapshot(snapshot: NodeRegistrySnapshot): boolean {
    if (!initialized.value) {
      replaceSnapshot(snapshot);
      initialized.value = true;
      return true;
    }

    if (snapshot.version <= registryVersion.value) {
      return false;
    }

    replaceSnapshot(snapshot);
    return true;
  }

  function ensureEmbeddedNodePresent(): void {
    if (!nodes.value.some((node) => node.id === EMBEDDED_NODE_ID)) {
      const embedded = createEmbeddedNode(resolveDefaultEmbeddedBaseUrl());
      nodes.value = [embedded, ...nodes.value];
      registryVersion.value += 1;
    }
  }

  async function initializeRegistry(): Promise<void> {
    if (initialized.value) {
      return;
    }

    lastError.value = null;

    if (!window.electronAPI?.getNodeRegistrySnapshot) {
      replaceSnapshot(createDefaultSnapshot(resolveDefaultEmbeddedBaseUrl()));
      initialized.value = true;
      return;
    }

    try {
      const snapshot = await window.electronAPI.getNodeRegistrySnapshot();
      replaceSnapshot(snapshot);
      ensureEmbeddedNodePresent();
      initialized.value = true;

      if (window.electronAPI.onNodeRegistryUpdated && !listenerCleanup.value) {
        listenerCleanup.value = window.electronAPI.onNodeRegistryUpdated((nextSnapshot) => {
          applyRegistrySnapshot(nextSnapshot);
        });
      }
    } catch (error) {
      lastError.value = error instanceof Error ? error.message : String(error);
      replaceSnapshot(createDefaultSnapshot(resolveDefaultEmbeddedBaseUrl()));
      initialized.value = true;
    }
  }

  function getNodeById(nodeId: string): NodeProfile | null {
    return nodeMap.value.get(nodeId) || null;
  }

  function getNodeBaseUrl(nodeId: string): string | null {
    return getNodeById(nodeId)?.baseUrl || null;
  }

  async function upsertRegistry(change: NodeRegistryChange): Promise<NodeRegistrySnapshot> {
    if (!window.electronAPI?.upsertNodeRegistry) {
      throw new Error('Node registry update is only supported in Electron runtime.');
    }
    const snapshot = await window.electronAPI.upsertNodeRegistry(change);
    applyRegistrySnapshot(snapshot);
    return snapshot;
  }

  async function addRemoteNode(input: {
    name: string;
    baseUrl: string;
    capabilities?: NodeProfile['capabilities'];
    capabilityProbeState?: NodeProfile['capabilityProbeState'];
  }): Promise<NodeProfile> {
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new Error('Node name is required');
    }

    const normalizedBaseUrl = normalizeNodeBaseUrl(input.baseUrl);
    if (
      nodes.value.some(
        (node) => normalizeNodeBaseUrl(node.baseUrl).toLowerCase() === normalizedBaseUrl.toLowerCase(),
      )
    ) {
      throw new Error('Node with the same base URL already exists');
    }

    const now = nowIsoString();
    const node: NodeProfile = {
      id: generateRemoteNodeId(),
      name: trimmedName,
      baseUrl: normalizedBaseUrl,
      nodeType: 'remote',
      isSystem: false,
      createdAt: now,
      updatedAt: now,
      capabilityProbeState: input.capabilityProbeState ?? 'unknown',
      capabilities: input.capabilities,
    };

    if (window.electronAPI?.upsertNodeRegistry) {
      await upsertRegistry({ type: 'add', node });
      await window.electronAPI.openNodeWindow?.(node.id);
      return getNodeById(node.id) || node;
    }

    nodes.value = [...nodes.value, node];
    registryVersion.value += 1;
    return node;
  }

  async function removeRemoteNode(nodeId: string): Promise<void> {
    if (nodeId === EMBEDDED_NODE_ID) {
      throw new Error('Embedded node cannot be removed');
    }

    if (window.electronAPI?.upsertNodeRegistry) {
      await upsertRegistry({
        type: 'remove',
        nodeId,
      });
      return;
    }

    nodes.value = nodes.value.filter((node) => node.id !== nodeId);
    registryVersion.value += 1;
  }

  async function renameNode(nodeId: string, nextName: string): Promise<void> {
    const trimmedName = nextName.trim();
    if (!trimmedName) {
      throw new Error('Node name is required');
    }

    if (window.electronAPI?.upsertNodeRegistry) {
      await upsertRegistry({
        type: 'rename',
        nodeId,
        name: trimmedName,
      });
      return;
    }

    nodes.value = nodes.value.map((node) => {
      if (node.id !== nodeId) {
        return node;
      }
      return {
        ...node,
        name: trimmedName,
        updatedAt: nowIsoString(),
      };
    });
    registryVersion.value += 1;
  }

  function teardownRegistryListener(): void {
    listenerCleanup.value?.();
    listenerCleanup.value = null;
  }

  return {
    registryVersion,
    nodes,
    initialized,
    lastError,
    remoteNodes,
    applyRegistrySnapshot,
    initializeRegistry,
    getNodeById,
    getNodeBaseUrl,
    addRemoteNode,
    removeRemoteNode,
    renameNode,
    teardownRegistryListener,
  };
});
