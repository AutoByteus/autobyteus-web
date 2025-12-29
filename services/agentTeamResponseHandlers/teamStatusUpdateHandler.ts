import type { GraphQlAgentTeamStatusUpdateData } from '~/generated/graphql';
import type { AgentTeamContext } from '~/types/agent/AgentTeamContext';

/**
 * Processes a team-level status update event by updating the team's current status.
 * @param data The status update data from the GraphQL subscription.
 * @param teamContext The full context for the agent team run.
 */
export function handleTeamStatusUpdate(
  data: GraphQlAgentTeamStatusUpdateData,
  teamContext: AgentTeamContext
): void {
  if (data.newStatus) {
    console.log(`Status update for team ${teamContext.teamId}: from ${teamContext.currentStatus} to ${data.newStatus}`);
    teamContext.currentStatus = data.newStatus;
  }
}
