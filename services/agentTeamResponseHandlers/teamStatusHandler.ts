import type { GraphQlAgentTeamStatusTransitionData } from '~/generated/graphql';
import type { AgentTeamContext } from '~/types/agent/AgentTeamContext';

/**
 * Processes a team-level status transition event by updating the team's current status.
 * @param data The status transition data from the GraphQL subscription.
 * @param teamContext The full context for the agent team run.
 */
export function handleTeamStatusTransition(
  data: GraphQlAgentTeamStatusTransitionData,
  teamContext: AgentTeamContext
): void {
  if (data.newStatus) {
    console.log(`Status transition for team ${teamContext.teamId}: from ${teamContext.currentStatus} to ${data.newStatus}`);
    teamContext.currentStatus = data.newStatus;
  }
}
