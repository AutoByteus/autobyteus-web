import type {
  GraphQLAgentTeamStreamEvent,
  GraphQLAgentEventRebroadcastPayload,
  GraphQLSubTeamEventRebroadcastPayload,
} from '~/generated/graphql';
import type { AgentTeamContext } from '~/types/agent/AgentTeamContext';
import { processAgentResponseEvent } from '~/services/agentResponseProcessor';
import { handleTeamPhaseTransition } from './agentTeamResponseHandlers/teamStatusHandler';
import { handleTasksAdded, handleTaskStatusUpdated } from './agentTeamResponseHandlers/taskPlanHandler';
import { useAgentTeamContextsStore } from '~/stores/agentTeamContextsStore';

/**
 * Main dispatcher for processing all agent team response events.
 * This function is now a pure utility that requires the context to be injected.
 * @param teamContext - The specific AgentTeamContext this event belongs to.
 * @param event - The `GraphQLAgentTeamStreamEvent` from the subscription.
 */
export function processAgentTeamResponseEvent(event: GraphQLAgentTeamStreamEvent): void {
  const teamContextsStore = useAgentTeamContextsStore();
  // Find the context from any profile, not just the active one.
  const teamContext = teamContextsStore.getTeamContextById(event.teamId);

  if (!teamContext) {
    console.warn(`Received event for an unknown or inactive team with ID: ${event.teamId}. Ignoring.`);
    return;
  }

  const data = event.data;

  switch (data.__typename) {
    case 'GraphQLAgentTeamPhaseTransitionData':
      handleTeamPhaseTransition(data, teamContext);
      break;

    case 'GraphQLAgentEventRebroadcastPayload':
      handleAgentEventRebroadcast(data, teamContext);
      break;

    case 'GraphQLSubTeamEventRebroadcastPayload':
      handleSubTeamEventRebroadcast(data, teamContext);
      break;
    
    case 'GraphQLTasksAddedEvent':
      handleTasksAdded(data, teamContext);
      break;

    case 'GraphQLTaskStatusUpdatedEvent':
      handleTaskStatusUpdated(data, teamContext);
      break;

    default:
      console.warn(`Unhandled team event data type: ${data.__typename}`);
      break;
  }
}

function handleAgentEventRebroadcast(payload: GraphQLAgentEventRebroadcastPayload, teamContext: AgentTeamContext) {
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

function handleSubTeamEventRebroadcast(payload: GraphQLSubTeamEventRebroadcastPayload, teamContext: AgentTeamContext) {
  // TODO: Implement recursive processing for nested teams.
  // This would involve finding the sub-team context and calling processAgentTeamResponseEvent on its event.
  // For now, we log it as unhandled.
  console.log(`Received event from sub-team '${payload.subTeamNodeName}'. Recursive processing is not yet implemented.`);
}
