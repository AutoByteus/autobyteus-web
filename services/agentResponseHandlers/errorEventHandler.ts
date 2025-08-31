import type { GraphQLErrorEventData } from '~/generated/graphql';
import type { AgentContext } from '~/types/agent/AgentContext';
import type { ErrorSegment } from '~/utils/aiResponseParser/types';
import { findOrCreateAIMessage } from './assistantResponseHandler';

/**
 * Processes an agent error event by adding a new ErrorSegment to the conversation.
 * @param eventData The error data from the GraphQL subscription.
 * @param agentContext The full context for the agent run.
 */
export function handleAgentError(
  eventData: GraphQLErrorEventData,
  agentContext: AgentContext
): void {
  const aiMessage = findOrCreateAIMessage(agentContext);

  const errorSegment: ErrorSegment = {
    type: 'error',
    source: eventData.source,
    message: eventData.message,
    details: eventData.details,
  };

  // Add the error segment to the current AI message.
  aiMessage.segments.push(errorSegment);
  
  // Mark the current AI message as complete, as an error is a terminal state for a turn.
  aiMessage.isComplete = true;
  if (aiMessage.parserInstance) {
    aiMessage.parserInstance.finalize();
  }
}
