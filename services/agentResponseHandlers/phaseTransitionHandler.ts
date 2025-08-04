import type { GraphQLAgentOperationalPhaseTransitionData } from '~/generated/graphql';
import type { AgentContext } from '~/types/agent/AgentContext';
import { useAgentContextsStore } from '~/stores/agentContextsStore';

/**
 * Processes an agent phase transition event by calling the agent contexts store
 * to update the agent's current phase.
 * @param data The phase transition data from the GraphQL subscription.
 * @param agentContext The full context for the agent run (used for logging and ID).
 */
export function handleAgentPhaseTransition(
  data: GraphQLAgentOperationalPhaseTransitionData,
  agentContext: AgentContext
): void {
  // The GraphQL enum has the same values as the string we want to store.
  if (data.newPhase) {
    console.log(`Phase transition for agent ${agentContext.state.agentId}: from ${agentContext.state.currentPhase} to ${data.newPhase}`);
    
    // Get an instance of the store
    const agentContextsStore = useAgentContextsStore();
    
    // Call the action to mutate the state
    agentContextsStore.updateAgentPhase(agentContext.state.agentId, data.newPhase);
  }
}
