import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAgentSelectionStore } from '~/stores/agentSelectionStore';

describe('agentSelectionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('initial state', () => {
    it('should have no selection initially', () => {
      const store = useAgentSelectionStore();
      expect(store.selectedInstanceId).toBeNull();
      expect(store.selectedType).toBeNull();
    });
  });

  describe('selectInstance', () => {
    it('should select an agent instance by default', () => {
      const store = useAgentSelectionStore();
      store.selectInstance('agent-123');

      expect(store.selectedInstanceId).toBe('agent-123');
      expect(store.selectedType).toBe('agent');
      expect(store.isAgentSelected).toBe(true);
      expect(store.isTeamSelected).toBe(false);
    });

    it('should select a team instance explicitly', () => {
      const store = useAgentSelectionStore();
      store.selectInstance('team-123', 'team');

      expect(store.selectedInstanceId).toBe('team-123');
      expect(store.selectedType).toBe('team');
      expect(store.isAgentSelected).toBe(false);
      expect(store.isTeamSelected).toBe(true);
    });

    it('should overwrite previous selection', () => {
      const store = useAgentSelectionStore();
      store.selectInstance('agent-123');
      store.selectInstance('team-456', 'team');

      expect(store.selectedInstanceId).toBe('team-456');
      expect(store.selectedType).toBe('team');
    });
  });

  describe('clearSelection', () => {
    it('should clear the selection and type', () => {
      const store = useAgentSelectionStore();
      store.selectInstance('team-123', 'team');
      store.clearSelection();

      expect(store.selectedInstanceId).toBeNull();
      expect(store.selectedType).toBeNull();
    });
  });
});
