
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { useWorkspaceStore } from '../workspace';
import { useFileExplorerStore } from '../fileExplorer';
import { TreeNode } from '~/utils/fileExplorer/TreeNode';

// Mock dependencies
const mockMutate = vi.fn();
const mockQuery = vi.fn();
const mockWaitForBoundBackendReady = vi.fn().mockResolvedValue(true);

vi.mock('~/utils/apolloClient', () => ({
  getApolloClient: () => ({
    mutate: mockMutate,
    query: mockQuery,
  }),
}));

// Mock GraphQL mutations/queries to avoid import errors in test environment if not transpiled
vi.mock('~/graphql/mutations/workspace_mutations', () => ({
    CreateWorkspace: 'mock-mutation'
}));
vi.mock('~/graphql/queries/workspace_queries', () => ({
    GetAllWorkspaces: 'mock-query'
}));
vi.mock('~/graphql/queries/file_explorer_queries', () => ({
    GetFolderChildren: 'mock-query-children'
}));

vi.mock('~/stores/windowNodeContextStore', () => ({
    useWindowNodeContextStore: () => ({
        waitForBoundBackendReady: mockWaitForBoundBackendReady,
        getBoundEndpoints: () => ({
            fileExplorerWs: 'ws://mock'
        }),
    }),
}));

// Mock FileExplorerStreamingService
vi.mock('~/services/fileExplorerStreaming/FileExplorerStreamingService', () => {
    return {
        FileExplorerStreamingService: vi.fn().mockImplementation(() => ({
            connect: vi.fn(),
            disconnect: vi.fn(),
        }))
    }
});

describe('workspaceStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createWorkspace', () => {
    it('should create a workspace and add it to state', async () => {
      const pinia = createTestingPinia({
        createSpy: vi.fn,
        stubActions: false, // We want to test real actions
      });
      setActivePinia(pinia);
      const store = useWorkspaceStore();

      // Mock Apollo response
      mockMutate.mockResolvedValue({
        data: {
          createWorkspace: {
            workspaceId: 'ws-123',
            name: 'Test WS',
            fileExplorer: JSON.stringify({ name: 'root', path: 'root', is_file: false, id: 'root-id' }),
            absolutePath: '/tmp/test',
            config: {}
          }
        }
      });

      const wsId = await store.createWorkspace({ root_path: '/tmp/test' });

      expect(wsId).toBe('ws-123');
      expect(store.workspaces['ws-123']).toBeDefined();
      expect(store.workspaces['ws-123'].name).toBe('Test WS');
      expect(store.workspaces['ws-123'].fileExplorer).toBeInstanceOf(TreeNode);
    });

    it('should throw error if mutation fails', async () => {
        const pinia = createTestingPinia({ createSpy: vi.fn, stubActions: false });
        setActivePinia(pinia);
        const store = useWorkspaceStore();
  
        mockMutate.mockResolvedValue({
          errors: [{ message: 'GraphQL Error' }]
        });
  
        await expect(store.createWorkspace({ root_path: '/bad' })).rejects.toThrow('GraphQL Error');
        expect(store.error).toBeTruthy();
    });
  });

  describe('fetchAllWorkspaces', () => {
      it('should populate workspaces from query', async () => {
        const pinia = createTestingPinia({ createSpy: vi.fn, stubActions: false });
        setActivePinia(pinia);
        const store = useWorkspaceStore();

        mockQuery.mockResolvedValue({
            data: {
                workspaces: [
                    {
                        workspaceId: 'ws-1', 
                        name: 'WS 1',
                        fileExplorer: JSON.stringify({ name: 'root1', path: 'root1', is_file: false, id: 'root1' }),
                        absolutePath: '/path/1',
                        config: {}
                    },
                    {
                        workspaceId: 'ws-2', 
                        name: 'WS 2',
                        fileExplorer: JSON.stringify({ name: 'root2', path: 'root2', is_file: false, id: 'root2' }),
                        absolutePath: '/path/2',
                        config: {}
                    }
                ]
            }
        });

        await store.fetchAllWorkspaces();

        expect(Object.keys(store.workspaces)).toHaveLength(2);
        expect(store.workspaces['ws-1']).toBeDefined();
        expect(store.workspaces['ws-2']).toBeDefined();
        expect(store.workspacesFetched).toBe(true);
      });
  });

  describe('handleFileSystemChange', () => {
    let store: any;
    let fileExplorerStore: any;

    beforeEach(async () => {
        const pinia = createTestingPinia({ createSpy: vi.fn, stubActions: false });
        setActivePinia(pinia);
        store = useWorkspaceStore();
        fileExplorerStore = useFileExplorerStore();

        // Setup a mock workspace
        const rootNode = new TreeNode('root', 'root', false, [], 'root-id');
        store.workspaces['ws-1'] = {
            workspaceId: 'ws-1',
            name: 'Test WS',
            fileExplorer: rootNode,
            nodeIdToNode: { 'root-id': rootNode },
            workspaceConfig: {},
            absolutePath: '/test'
        };
    });

    it('should handle ADD change', () => {
        const changeEvent = {
            changes: [{
                type: 'add',
                node: { name: 'new-file.txt', path: 'root/new-file.txt', is_file: true, id: 'file-1', children: [] },
                parent_id: 'root-id'
            }]
        };

        store.handleFileSystemChange('ws-1', changeEvent);

        const ws = store.workspaces['ws-1'];
        expect(ws.fileExplorer.children).toHaveLength(1);
        expect(ws.fileExplorer.children[0].name).toBe('new-file.txt');
        expect(ws.nodeIdToNode['file-1']).toBeDefined();
    });

    it('should handle DELETE change', () => {
        // Setup: Add a file first
        const ws = store.workspaces['ws-1'];
        const fileNode = new TreeNode('file.txt', 'root/file.txt', true, [], 'file-1');
        ws.fileExplorer.addChild(fileNode);
        ws.nodeIdToNode['file-1'] = fileNode;

        const changeEvent = {
            changes: [{
                type: 'delete',
                node_id: 'file-1',
                parent_id: 'root-id'
            }]
        };

        store.handleFileSystemChange('ws-1', changeEvent);

        expect(ws.fileExplorer.children).toHaveLength(0);
        expect(ws.nodeIdToNode['file-1']).toBeUndefined();
    });

    it('should handle MODIFY change by invalidating content', () => {
        // Setup: Add a file
        const ws = store.workspaces['ws-1'];
        const fileNode = new TreeNode('file.txt', 'root/file.txt', true, [], 'file-1');
        ws.fileExplorer.addChild(fileNode);
        ws.nodeIdToNode['file-1'] = fileNode;

        const changeEvent = {
            changes: [{
                type: 'modify',
                node_id: 'file-1',
                parent_id: 'root-id'
            }]
        };

        store.handleFileSystemChange('ws-1', changeEvent);

        expect(fileExplorerStore.invalidateFileContent).toHaveBeenCalledWith('root/file.txt', 'ws-1');
    });

    it('should NOT invalidate content on MODIFY if explicitly ignored', () => {
         // Setup: Add a file
         const ws = store.workspaces['ws-1'];
         const fileNode = new TreeNode('file.txt', 'root/file.txt', true, [], 'file-1');
         ws.fileExplorer.addChild(fileNode);
         ws.nodeIdToNode['file-1'] = fileNode;
 
         // Mock the ignore list in fileExplorerStore
         // Since we used stubActions: false, we can manipulate state manually or mock the getter
         // The store implementation accesses fileExplorerStore._getOrCreateWorkspaceState
         // We can mock that return value if we spy on it, but accessing private valid might be tricky.
         // A simpler way is to depend on the fact that fileExplorerStore is a mocked store from pinia-testing
         
         const workspaceState = { filesToIgnoreNextModify: new Set(['root/file.txt']) };
         vi.spyOn(fileExplorerStore, '_getOrCreateWorkspaceState').mockReturnValue(workspaceState);

         const changeEvent = {
             changes: [{
                 type: 'modify',
                 node_id: 'file-1',
                 parent_id: 'root-id'
             }]
         };
 
         store.handleFileSystemChange('ws-1', changeEvent);
 
         expect(fileExplorerStore.invalidateFileContent).not.toHaveBeenCalled();
         expect(workspaceState.filesToIgnoreNextModify.has('root/file.txt')).toBe(false); // Should be consumed
    });
  });
});
