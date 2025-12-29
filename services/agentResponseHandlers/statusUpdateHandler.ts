import type { GraphQlAgentStatusUpdateData } from '~/generated/graphql';
import type { AgentContext } from '~/types/agent/AgentContext';

/**
 * Processes an agent status update event by calling the agent contexts store
 * to update the agent's current status.
 * @param data The status update data from the GraphQL subscription.
 * @param agentContext The full context for the agent run (used for logging and ID).
 */
export function handleAgentStatusUpdate(
  data: GraphQlAgentStatusUpdateData,
  agentContext: AgentContext
): void {
  // The GraphQL enum has the same values as the string we want to store.
  if (data.newStatus) {
    console.log(`Status update for agent ${agentContext.state.agentId}: from ${agentContext.state.currentStatus} to ${data.newStatus}`);
    
    // Directly mutate the status on the provided context object.
    agentContext.state.currentStatus = data.newStatus;
  }
}
