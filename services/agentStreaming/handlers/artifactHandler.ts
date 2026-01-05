import { useAgentArtifactsStore } from '~/stores/agentArtifactsStore';
import type { AgentContext } from '~/types/agent/AgentContext';

export const handleArtifactPersisted = (
  payload: any,
  context: AgentContext
): void => {
  const { agent_id, path } = payload;
  const store = useAgentArtifactsStore();
  store.markArtifactPersisted(agent_id, path);
};
