import { defineStore } from 'pinia';
import { useAgentRunConfigStore } from '~/stores/agentRunConfigStore';
import { useAgentSelectionStore } from '~/stores/agentSelectionStore';
import { AgentContext } from '~/types/agent/AgentContext';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';
import type { Conversation } from '~/types/conversation';

interface AgentContextsStoreState {
  /** All running agent instances, keyed by agentId */
  instances: Map<string, AgentContext>;
}

/**
 * @store agentContexts
 * @description Central repository for active agent context state.
 */
export const useAgentContextsStore = defineStore('agentContexts', {
  state: (): AgentContextsStoreState => ({
    instances: new Map(),
  }),

  getters: {
    /**
     * Currently selected agent instance (via selection store).
     */
    activeInstance(): AgentContext | undefined {
      const selectionStore = useAgentSelectionStore();
      if (selectionStore.selectedType !== 'agent' || !selectionStore.selectedInstanceId) return undefined;
      return this.instances.get(selectionStore.selectedInstanceId);
    },

    /**
     * All instances as array.
     */
    allInstances(): AgentContext[] {
      return Array.from(this.instances.values());
    },

    /**
     * Instances grouped by agent definition id.
     */
    instancesByDefinition(): Map<string, AgentContext[]> {
      const grouped = new Map<string, AgentContext[]>();
      for (const instance of this.instances.values()) {
        const defId = instance.config.agentDefinitionId;
        if (!grouped.has(defId)) grouped.set(defId, []);
        grouped.get(defId)!.push(instance);
      }
      return grouped;
    },

    /**
     * Get instance by ID.
     */
    getInstance: (state) => (id: string) => state.instances.get(id),

    /**
     * Get config for a specific instance.
     */
    getConfigForInstance: (state) => (id: string): AgentRunConfig | null => {
      return state.instances.get(id)?.config ?? null;
    },
  },

  actions: {
    /**
     * Create a new agent instance from the current run config template.
     * Sets it as the selected instance.
     */
    createInstanceFromTemplate(): string {
      const configStore = useAgentRunConfigStore();
      const template = configStore.config;

      if (!template) {
        throw new Error('No run config template available');
      }

      const config: AgentRunConfig = {
        agentDefinitionId: template.agentDefinitionId,
        agentDefinitionName: template.agentDefinitionName,
        llmModelIdentifier: template.llmModelIdentifier,
        workspaceId: template.workspaceId,
        autoExecuteTools: template.autoExecuteTools,
        isLocked: false,
      };

      const tempId = `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const conversation: Conversation = {
        id: tempId,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        agentDefinitionId: template.agentDefinitionId,
      };

      const runState = new AgentRunState(tempId, conversation);
      const context = new AgentContext(config, runState);

      this.instances.set(tempId, context);

      const selectionStore = useAgentSelectionStore();
      selectionStore.selectInstance(tempId, 'agent');

      return tempId;
    },

    /**
     * Remove an instance.
     */
    removeInstance(instanceId: string) {
      const selectionStore = useAgentSelectionStore();
      const isSelected = selectionStore.selectedType === 'agent' && selectionStore.selectedInstanceId === instanceId;

      if (this.instances.has(instanceId)) {
        this.instances.delete(instanceId);
        if (isSelected) {
          selectionStore.clearSelection();
        }
      }
    },

    /**
     * Lock the configuration of an instance (e.g. after first message).
     */
    lockConfig(instanceId: string) {
      const instance = this.instances.get(instanceId);
      if (instance) {
        instance.config.isLocked = true;
      }
    },

    /**
     * Promote a temporary ID (pre-run) to a permanent ID (from backend).
     */
    promoteTemporaryId(tempId: string, permanentId: string) {
      const instance = this.instances.get(tempId);
      if (!instance) return;

      this.instances.delete(tempId);
      instance.state.promoteTemporaryId(permanentId);
      this.instances.set(permanentId, instance);

      const selectionStore = useAgentSelectionStore();
      if (selectionStore.selectedType === 'agent' && selectionStore.selectedInstanceId === tempId) {
        selectionStore.selectInstance(permanentId, 'agent');
      }
    },
  },
});
