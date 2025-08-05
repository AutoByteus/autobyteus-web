import type { GraphQLAgentOperationalPhaseTransitionData } from '~/generated/graphql';
import type { AgentContext } from '~/types/agent/AgentContext';

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
    
    // Directly mutate the phase on the provided context object.
    agentContext.state.currentPhase = data.newPhase;
  }
}
