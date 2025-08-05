import type { GraphQLAgentTeamPhaseTransitionData } from '~/generated/graphql';
import type { AgentTeamContext } from '~/types/agent/AgentTeamContext';

/**
 * Processes a team-level phase transition event by updating the team's current phase.
 * @param data The phase transition data from the GraphQL subscription.
 * @param teamContext The full context for the agent team run.
 */
export function handleTeamPhaseTransition(
  data: GraphQLAgentTeamPhaseTransitionData,
  teamContext: AgentTeamContext
): void {
  if (data.newPhase) {
    console.log(`Phase transition for team ${teamContext.teamId}: from ${teamContext.currentPhase} to ${data.newPhase}`);
    teamContext.currentPhase = data.newPhase;
  }
}
