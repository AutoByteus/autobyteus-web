import type { AgentResponseSubscription } from '~/generated/graphql';
import type { AgentContext } from '~/types/agent/AgentContext';
import { 
  handleAssistantChunk,
  handleAssistantCompleteResponse
} from './agentResponseHandlers/assistantResponseHandler';
import { 
  handleToolInvocationApprovalRequested,
  handleToolInvocationAutoExecuting,
  handleToolInteractionLog,
} from './agentResponseHandlers/toolCallHandler';

/**
 * Main dispatcher for processing all agent response events.
 * @param eventData - The 'data' object from the GraphQL subscription payload.
 * @param agentContext - The context of the agent this event belongs to.
 */
export function processAgentResponseEvent(
  eventData: AgentResponseSubscription['agentResponse']['data'],
  agentContext: AgentContext
): void {
  // Update the 'updatedAt' timestamp on the conversation
  agentContext.conversation.updatedAt = new Date().toISOString();

  switch (eventData.__typename) {
    case 'GraphQLAssistantChunkData':
      return handleAssistantChunk(eventData, agentContext);

    case 'GraphQLAssistantCompleteResponseData':
      return handleAssistantCompleteResponse(eventData, agentContext);

    case 'GraphQLToolInvocationApprovalRequestedData':
      return handleToolInvocationApprovalRequested(eventData, agentContext);

    case 'GraphQLToolInvocationAutoExecutingData':
      return handleToolInvocationAutoExecuting(eventData, agentContext);

    case 'GraphQLToolInteractionLogEntryData':
      return handleToolInteractionLog(eventData, agentContext);
      
    case 'GraphQLErrorEventData':
      // Handle error events here or in a dedicated handler.
      console.error('Agent Stream Error:', eventData.message, eventData.details);
      break;

    default:
      // Optional: log unhandled event types.
      // console.warn(`Unhandled event type: ${eventData.__typename}`);
      break;
  }
}
