import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAgentContextsStore } from '../agentContextsStore';
import { useAgentRunConfigStore } from '../agentRunConfigStore';
import { useAgentSelectionStore } from '../agentSelectionStore';
import type { AgentDefinition } from '../agentDefinitionStore';

// Mock AgentDefinition
const mockAgentDef: AgentDefinition = {
  id: 'def-1',
  name: 'TestAgent',
  role: 'assistant',
  description: 'Test Description',
  avatarUrl: '/rest/files/images/test-agent.png',
  toolNames: [],
  inputProcessorNames: [],
  llmResponseProcessorNames: [],
  systemPromptProcessorNames: [],
  toolExecutionResultProcessorNames: [],
  toolInvocationPreprocessorNames: [],
  lifecycleProcessorNames: [],
  skillNames: [],
  prompts: [],
};

describe('agentContextsStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('should initialize with empty instances', () => {
        const store = useAgentContextsStore();
        expect(store.instances.size).toBe(0);
        expect(store.activeInstance).toBeUndefined();
    });

    describe('createInstanceFromTemplate', () => {
        it('should create an instance from run config template', () => {
            const store = useAgentContextsStore();
            const configStore = useAgentRunConfigStore();
            const selectionStore = useAgentSelectionStore();

            // Setup template
            configStore.setTemplate(mockAgentDef);
            configStore.updateAgentConfig({
                llmModelIdentifier: 'gpt-4',
                workspaceId: 'ws-1',
                autoExecuteTools: true,
                llmConfig: { reasoning_effort: 'high' },
            });

            // Create instance
            const instanceId = store.createInstanceFromTemplate();

            // Verify instance exists
            expect(instanceId).toMatch(/^temp-/);
            const instance = store.instances.get(instanceId);
            expect(instance).toBeDefined();

            // Verify config was copied
            expect(instance?.config.agentDefinitionId).toBe('def-1');
            expect(instance?.config.agentDefinitionName).toBe('TestAgent');
            expect(instance?.config.agentAvatarUrl).toBe('/rest/files/images/test-agent.png');
            expect(instance?.config.llmModelIdentifier).toBe('gpt-4');
            expect(instance?.config.workspaceId).toBe('ws-1');
            expect(instance?.config.autoExecuteTools).toBe(true);
            expect(instance?.config.llmConfig).toEqual({ reasoning_effort: 'high' });
            expect(instance?.config.isLocked).toBe(false);

            // Verify selection was updated
            expect(selectionStore.selectedInstanceId).toBe(instanceId);
        });

        it('should throw error if no template exists', () => {
            const store = useAgentContextsStore();
            expect(() => store.createInstanceFromTemplate()).toThrowError("No run config template available");
        });
    });

    describe('removeInstance', () => {
        it('should auto-select another instance when removing the selected one', () => {
            const store = useAgentContextsStore();
            const configStore = useAgentRunConfigStore();
            const selectionStore = useAgentSelectionStore();

            configStore.setTemplate(mockAgentDef);
            const id1 = store.createInstanceFromTemplate();
            const id2 = store.createInstanceFromTemplate();

            // id2 is selected (most recently created)
            expect(selectionStore.selectedInstanceId).toBe(id2);

            store.removeInstance(id2);

            expect(store.instances.has(id2)).toBe(false);
            // Should auto-select the remaining instance
            expect(selectionStore.selectedInstanceId).toBe(id1);
            expect(selectionStore.selectedType).toBe('agent');
        });

        it('should clear selection when removing the only instance', () => {
            const store = useAgentContextsStore();
            const configStore = useAgentRunConfigStore();
            const selectionStore = useAgentSelectionStore();

            configStore.setTemplate(mockAgentDef);
            const id = store.createInstanceFromTemplate();

            expect(store.instances.has(id)).toBe(true);
            expect(selectionStore.selectedInstanceId).toBe(id);

            store.removeInstance(id);

            expect(store.instances.has(id)).toBe(false);
            expect(selectionStore.selectedInstanceId).toBeNull();
        });

        it('should not clear selection if removing non-selected instance', () => {
            const store = useAgentContextsStore();
            const configStore = useAgentRunConfigStore();
            const selectionStore = useAgentSelectionStore();

            configStore.setTemplate(mockAgentDef);
            const id1 = store.createInstanceFromTemplate();
            const id2 = store.createInstanceFromTemplate();

            // Select id2
            selectionStore.selectInstance(id2);

            store.removeInstance(id1);

            expect(store.instances.has(id1)).toBe(false);
            expect(selectionStore.selectedInstanceId).toBe(id2);
        });
    });

    describe('lockConfig', () => {
        it('should lock the configuration of an instance', () => {
            const store = useAgentContextsStore();
            const configStore = useAgentRunConfigStore();
            
            configStore.setTemplate(mockAgentDef);
            const id = store.createInstanceFromTemplate();

            const instance = store.instances.get(id);
            expect(instance?.config.isLocked).toBe(false);

            store.lockConfig(id);

            expect(instance?.config.isLocked).toBe(true);
        });
    });

    describe('promoteTemporaryId', () => {
        it('should replace active instance ID with permanent one', () => {
            const store = useAgentContextsStore();
            const configStore = useAgentRunConfigStore();
            const selectionStore = useAgentSelectionStore();
            
            configStore.setTemplate(mockAgentDef);
            const tempId = store.createInstanceFromTemplate();
            const permId = 'perm-123';

            store.promoteTemporaryId(tempId, permId);

            expect(store.instances.has(tempId)).toBe(false);
            expect(store.instances.has(permId)).toBe(true);
            
            // Verify content preserved
            const instance = store.instances.get(permId);
            expect(instance?.config.agentDefinitionId).toBe('def-1');
            expect(instance?.state.agentId).toBe(permId);

            // Verify selection updated
            expect(selectionStore.selectedInstanceId).toBe(permId);
        });
    });

    describe('activeInstance getter', () => {
        it('should return the currently selected instance', () => {
            const store = useAgentContextsStore();
            const configStore = useAgentRunConfigStore();
            const selectionStore = useAgentSelectionStore();
            
            configStore.setTemplate(mockAgentDef);
            const id = store.createInstanceFromTemplate();

            expect(store.activeInstance).toBeDefined();
            expect(store.activeInstance?.state.agentId).toBe(id);

            selectionStore.clearSelection();
            expect(store.activeInstance).toBeUndefined();
        });
    });
});
