import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { reactive } from 'vue';
import { useAgentContextsStore } from '../agentContextsStore';
import { useAgentLaunchProfileStore } from '../agentLaunchProfileStore';
import { useSelectedLaunchProfileStore } from '../selectedLaunchProfileStore';

// Mock dependencies
vi.mock('../agentLaunchProfileStore', () => ({
  useAgentLaunchProfileStore: vi.fn(),
}));

vi.mock('../selectedLaunchProfileStore', () => ({
  useSelectedLaunchProfileStore: vi.fn(),
}));

describe('agentContextsStore', () => {
    // Shared reactive mocks
    let mockSelectedProfileStore: any;
    let mockLaunchProfileStore: any;

    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
        
        // Create reactive mock objects
        mockSelectedProfileStore = reactive({
            selectedProfileId: 'profile-1',
            selectedProfileType: 'agent',
        });
        
        mockLaunchProfileStore = reactive({
            activeLaunchProfile: {
                id: 'profile-1',
                workspaceId: 'ws-1',
                agentDefinition: { id: 'def-1' }
            }
        });

        // Setup default mock returns to point to these reactive objects
        // @ts-ignore
        useSelectedLaunchProfileStore.mockReturnValue(mockSelectedProfileStore);
        // @ts-ignore
        useAgentLaunchProfileStore.mockReturnValue(mockLaunchProfileStore);
    });

    it('should initialize with empty state', () => {
        const store = useAgentContextsStore();
        expect(store.agentsByLaunchProfile.size).toBe(0);
        expect(store.selectedAgentId).toBeNull();
    });

    it('should throw error if accessing state without active profile', () => {
        mockSelectedProfileStore.selectedProfileId = null;
        const store = useAgentContextsStore();
        
        expect(() => store.createNewAgentContext()).toThrowError("Cannot access agent context state");
    });

    it('createNewAgentContext should create a new agent context and set it as selected', () => {
        const store = useAgentContextsStore();
        
        store.createNewAgentContext();
        
        expect(store.allOpenAgents.length).toBe(1);
        expect(store.selectedAgentId).not.toBeNull();
        expect(store.selectedAgent).toBeDefined();
        expect(store.selectedAgent?.state.agentId).toMatch(/^temp-/);
    });

    it('createContextForExistingAgent should create context with specific ID', () => {
        const store = useAgentContextsStore();
        const existingId = 'existing-agent-id';
        
        store.createContextForExistingAgent(existingId);
        
        expect(store.allOpenAgents.length).toBe(1);
        expect(store.selectedAgentId).toBe(existingId);
        expect(store.selectedAgent?.state.agentId).toBe(existingId);
    });

    it('promoteTemporaryAgentId should update map key and selected ID', () => {
        const store = useAgentContextsStore();
        store.createNewAgentContext(); // Create temp
        
        const tempId = store.selectedAgentId!;
        const permanentId = 'perm-id-1';
        
        store.promoteTemporaryAgentId(tempId, permanentId);
        
        expect(store.getAgentContextById(tempId)).toBeUndefined();
        expect(store.getAgentContextById(permanentId)).toBeDefined();
        expect(store.selectedAgentId).toBe(permanentId);
        // Verify state inside context is promoted
        expect(store.selectedAgent?.state.agentId).toBe(permanentId); 
    });

    it('removeAgentContext should remove context and update selection', () => {
        const store = useAgentContextsStore();
        store.createContextForExistingAgent('agent-1');
        store.createContextForExistingAgent('agent-2');
        
        // Should select the last one added
        expect(store.selectedAgentId).toBe('agent-2');
        
        store.removeAgentContext('agent-2');
        
        expect(store.allOpenAgents.length).toBe(1);
        expect(store.getAgentContextById('agent-2')).toBeUndefined();
        // Should revert selection to previous or last available
        expect(store.selectedAgentId).toBe('agent-1'); 
        
         store.removeAgentContext('agent-1');
         expect(store.selectedAgentId).toBeNull();
    });
    
    it('should isolate state by launch profile', () => {
        // 1. Setup profile 1
        const store = useAgentContextsStore();
        // Ensure defaults are for profile 1
        mockSelectedProfileStore.selectedProfileId = 'profile-1';
        mockLaunchProfileStore.activeLaunchProfile.id = 'profile-1';

        store.createContextForExistingAgent('agent-p1');
        expect(store.allOpenAgents.length).toBe(1);

        // 2. Switch to profile 2
        mockSelectedProfileStore.selectedProfileId = 'profile-2';
        mockLaunchProfileStore.activeLaunchProfile.id = 'profile-2';
        mockLaunchProfileStore.activeLaunchProfile.workspaceId = 'ws-2';

        // Store instance is singleton, but internal state access depends on profile
        // Since we updated reactive properties, the getter _currentProfileState should re-evaluate
        expect(store.allOpenAgents.length).toBe(0); // Should be empty for new profile
        
        store.createContextForExistingAgent('agent-p2');
        expect(store.allOpenAgents.length).toBe(1);
        expect(store.selectedAgentId).toBe('agent-p2');
        
        // 3. Switch back to profile 1
        mockSelectedProfileStore.selectedProfileId = 'profile-1';
        // Note: actions need the launch profile ID to match for creation, 
        // but viewing (getters) primarily relies on selectedProfileId in selectedLaunchProfileStore
        
        expect(store.allOpenAgents.length).toBe(1);
        expect(store.selectedAgentId).toBe('agent-p1'); // Selection state remembered per profile
    });
});
