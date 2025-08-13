import type { GraphQLSystemTaskNotificationData } from '~/generated/graphql';
import type { AIMessage } from '~/types/conversation';
import type { AgentContext } from '~/types/agent/AgentContext';
import type { SystemTaskNotificationSegment } from '~/utils/aiResponseParser/types';
import { findOrCreateAIMessage } from './assistantResponseHandler'; // IMPORT the shared function

/**
 * Processes a system task notification event by adding a new segment to the conversation.
 * @param eventData The notification data from the GraphQL subscription.
 * @param agentContext The full context for the agent run.
 */
export function handleSystemTaskNotification(
  eventData: GraphQLSystemTaskNotificationData,
  agentContext: AgentContext
): void {
  // Use the shared, correct function to ensure the AIMessage has a parser instance
  const aiMessage = findOrCreateAIMessage(agentContext);

  const notificationSegment: SystemTaskNotificationSegment = {
    type: 'system_task_notification',
    senderId: eventData.senderId,
    content: eventData.content,
  };

  // Add this segment to the end of the array to ensure chronological order.
  aiMessage.segments.push(notificationSegment);
}
