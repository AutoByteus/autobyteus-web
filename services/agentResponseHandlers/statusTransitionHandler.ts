import type { GraphQlAgentStatusTransitionData } from '~/generated/graphql';
import type { AgentContext } from '~/types/agent/AgentContext';

/**
 * Processes an agent status transition event by calling the agent contexts store
 * to update the agent's current status.
 * @param data The status transition data from the GraphQL subscription.
 * @param agentContext The full context for the agent run (used for logging and ID).
 */
export function handleAgentStatusTransition(
  data: GraphQlAgentStatusTransitionData,
  agentContext: AgentContext
): void {
  // The GraphQL enum has the same values as the string we want to store.
  if (data.newStatus) {
    console.log(`Status transition for agent ${agentContext.state.agentId}: from ${agentContext.state.currentStatus} to ${data.newStatus}`);
    
    // Directly mutate the status on the provided context object.
    agentContext.state.currentStatus = data.newStatus;
  }
}
