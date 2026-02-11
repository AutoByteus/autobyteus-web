import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { EMBEDDED_NODE_ID, type NodeRegistrySnapshot } from '~/types/node';
import { useNodeStore } from '../nodeStore';

function setElectronApiMock(mock: Partial<Window['electronAPI']> | null): void {
  Object.defineProperty(window, 'electronAPI', {
    configurable: true,
    writable: true,
    value: mock,
  });
}

describe('nodeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
    setElectronApiMock(null);
  });

  it('initializes with embedded node when electron bridge is unavailable', async () => {
    const store = useNodeStore();
    await store.initializeRegistry();

    expect(store.initialized).toBe(true);
    expect(store.nodes).toHaveLength(1);
    expect(store.nodes[0].id).toBe(EMBEDDED_NODE_ID);
    expect(store.nodes[0].nodeType).toBe('embedded');
  });

  it('applies only newer registry snapshots', async () => {
    const store = useNodeStore();

    const freshSnapshot: NodeRegistrySnapshot = {
      version: 5,
      nodes: [
        {
          id: EMBEDDED_NODE_ID,
          name: 'Embedded Node',
          baseUrl: 'http://localhost:29695',
          nodeType: 'embedded',
          isSystem: true,
          createdAt: '2026-02-08T00:00:00.000Z',
          updatedAt: '2026-02-08T00:00:00.000Z',
          capabilityProbeState: 'ready',
          capabilities: { terminal: true, fileExplorerStreaming: true },
        },
      ],
    };

    const appliedFresh = store.applyRegistrySnapshot(freshSnapshot);
    const appliedStale = store.applyRegistrySnapshot({ ...freshSnapshot, version: 4 });

    expect(appliedFresh).toBe(true);
    expect(appliedStale).toBe(false);
    expect(store.registryVersion).toBe(5);
  });

  it('initializes from electron snapshot and subscribes to updates', async () => {
    const onRegistryUpdated = vi.fn().mockImplementation((callback: (snapshot: NodeRegistrySnapshot) => void) => {
      callback({
        version: 9,
        nodes: [
          {
            id: EMBEDDED_NODE_ID,
            name: 'Embedded Node',
            baseUrl: 'http://localhost:29695',
            nodeType: 'embedded',
            isSystem: true,
            createdAt: '2026-02-08T00:00:00.000Z',
            updatedAt: '2026-02-08T00:00:00.000Z',
            capabilityProbeState: 'ready',
            capabilities: { terminal: true, fileExplorerStreaming: true },
          },
        ],
      });
      return vi.fn();
    });

    setElectronApiMock({
      getNodeRegistrySnapshot: vi.fn().mockResolvedValue({
        version: 3,
        nodes: [
          {
            id: EMBEDDED_NODE_ID,
            name: 'Embedded Node',
            baseUrl: 'http://localhost:29695',
            nodeType: 'embedded',
            isSystem: true,
            createdAt: '2026-02-08T00:00:00.000Z',
            updatedAt: '2026-02-08T00:00:00.000Z',
            capabilityProbeState: 'ready',
            capabilities: { terminal: true, fileExplorerStreaming: true },
          },
        ],
      }),
      onNodeRegistryUpdated: onRegistryUpdated,
    });

    const store = useNodeStore();
    await store.initializeRegistry();

    expect(store.registryVersion).toBe(9);
    expect(onRegistryUpdated).toHaveBeenCalledTimes(1);
  });

  it('adds remote node through electron upsert and opens node window', async () => {
    const upsertNodeRegistry = vi.fn().mockImplementation(async (change) => {
      return {
        version: 2,
        nodes: [
          {
            id: EMBEDDED_NODE_ID,
            name: 'Embedded Node',
            baseUrl: 'http://localhost:29695',
            nodeType: 'embedded',
            isSystem: true,
            createdAt: '2026-02-08T00:00:00.000Z',
            updatedAt: '2026-02-08T00:00:00.000Z',
            capabilityProbeState: 'ready',
            capabilities: { terminal: true, fileExplorerStreaming: true },
          },
          change.node,
        ],
      } satisfies NodeRegistrySnapshot;
    });
    const openNodeWindow = vi.fn().mockResolvedValue({ windowId: 101, created: true });

    setElectronApiMock({
      getNodeRegistrySnapshot: vi.fn().mockResolvedValue({
        version: 1,
        nodes: [
          {
            id: EMBEDDED_NODE_ID,
            name: 'Embedded Node',
            baseUrl: 'http://localhost:29695',
            nodeType: 'embedded',
            isSystem: true,
            createdAt: '2026-02-08T00:00:00.000Z',
            updatedAt: '2026-02-08T00:00:00.000Z',
            capabilityProbeState: 'ready',
            capabilities: { terminal: true, fileExplorerStreaming: true },
          },
        ],
      }),
      onNodeRegistryUpdated: vi.fn().mockReturnValue(vi.fn()),
      upsertNodeRegistry,
      openNodeWindow,
    });

    const store = useNodeStore();
    await store.initializeRegistry();

    const added = await store.addRemoteNode({
      name: 'Docker Node',
      baseUrl: 'http://localhost:8000',
      capabilities: {
        terminal: false,
        fileExplorerStreaming: false,
      },
      capabilityProbeState: 'degraded',
    });

    expect(added.nodeType).toBe('remote');
    expect(added.capabilities).toEqual({
      terminal: false,
      fileExplorerStreaming: false,
    });
    expect(added.capabilityProbeState).toBe('degraded');
    expect(upsertNodeRegistry).toHaveBeenCalledTimes(1);
    expect(openNodeWindow).toHaveBeenCalledWith(added.id);
  });

  it('rejects removing embedded node', async () => {
    const store = useNodeStore();
    await store.initializeRegistry();

    await expect(store.removeRemoteNode(EMBEDDED_NODE_ID)).rejects.toThrow(
      'Embedded node cannot be removed',
    );
  });
});
