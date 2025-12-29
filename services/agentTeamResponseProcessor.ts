import type {
  GraphQlAgentTeamStreamEvent,
  GraphQlAgentEventRebroadcastPayload,
  GraphQlSubTeamEventRebroadcastPayload,
} from '~/generated/graphql';
import type { AgentTeamContext } from '~/types/agent/AgentTeamContext';
import { processAgentResponseEvent } from '~/services/agentResponseProcessor';
import { handleTeamStatusTransition } from './agentTeamResponseHandlers/teamStatusHandler';
import { handleTasksCreated, handleTaskStatusUpdated } from './agentTeamResponseHandlers/taskPlanHandler';
// No longer importing any stores. It is now completely decoupled.

/**
 * Main dispatcher for processing all agent team response events.
 * This function is now a pure utility that requires the context to be injected.
 * @param teamContext - The specific AgentTeamContext this event belongs to.
 * @param event - The `GraphQLAgentTeamStreamEvent` from the subscription.
 */
export function processAgentTeamResponseEvent(teamContext: AgentTeamContext, event: GraphQlAgentTeamStreamEvent): void {
  const data = event.data;

  switch (data.__typename) {
    case 'GraphQLAgentTeamStatusTransitionData':
      handleTeamStatusTransition(data, teamContext);
      break;

    case 'GraphQLAgentEventRebroadcastPayload':
      handleAgentEventRebroadcast(data, teamContext);
      break;

    case 'GraphQLSubTeamEventRebroadcastPayload':
      handleSubTeamEventRebroadcast(data, teamContext);
      break;
    
    case 'GraphQLTasksCreatedEvent':
      handleTasksCreated(data, teamContext);
      break;

    case 'GraphQLTaskStatusUpdatedEvent':
      handleTaskStatusUpdated(data, teamContext);
      break;

    default:
      console.warn(`Unhandled team event data type: ${data.__typename}`);
      break;
  }
}

function handleAgentEventRebroadcast(payload: GraphQlAgentEventRebroadcastPayload, teamContext: AgentTeamContext) {
  const memberAgentContext = teamContext.members.get(payload.agentName);
  if (!memberAgentContext) {
    console.warn(`Received rebroadcasted event for unknown member '${payload.agentName}' in team '${teamContext.teamId}'.`);
    return;
  }
  
  const agentEventData = payload.agentEvent?.data;
  if (agentEventData) {
    // Reuse the existing single-agent processor
    processAgentResponseEvent(agentEventData, memberAgentContext);
  }
}

function handleSubTeamEventRebroadcast(payload: GraphQlSubTeamEventRebroadcastPayload, teamContext: AgentTeamContext) {
  // TODO: Implement recursive processing for nested teams.
  // This would involve finding the sub-team context and calling processAgentTeamResponseEvent on its event.
  // For now, we log it as unhandled.
  console.log(`Received event from sub-team '${payload.subTeamNodeName}'. Recursive processing is not yet implemented.`);
}
