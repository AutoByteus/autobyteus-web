import type { AgentResponseSubscription } from '~/generated/graphql';
import type { Conversation } from '~/types/conversation';
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
 * @param conversation - The conversation object to be updated.
 */
export function processAgentResponseEvent(
  eventData: AgentResponseSubscription['agentResponse']['data'],
  conversation: Conversation
): void {
  switch (eventData.__typename) {
    case 'GraphQLAssistantChunkData':
      return handleAssistantChunk(eventData, conversation);

    case 'GraphQLAssistantCompleteResponseData':
      return handleAssistantCompleteResponse(eventData, conversation);

    case 'GraphQLToolInvocationApprovalRequestedData':
      return handleToolInvocationApprovalRequested(eventData, conversation);

    case 'GraphQLToolInvocationAutoExecutingData':
      return handleToolInvocationAutoExecuting(eventData, conversation);

    case 'GraphQLToolInteractionLogEntryData':
      return handleToolInteractionLog(eventData, conversation);
      
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
