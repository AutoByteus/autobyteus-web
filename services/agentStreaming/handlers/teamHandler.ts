/**
 * Team-specific event handlers.
 * 
 * Layer 3 of the agent streaming architecture - handles team-only events:
 * INTER_AGENT_MESSAGE, SYSTEM_TASK_NOTIFICATION
 */

import type { AgentContext } from '~/types/agent/AgentContext';
import type { InterAgentMessageSegment, SystemTaskNotificationSegment } from '~/types/segments';
import type { 
  InterAgentMessagePayload, 
  SystemTaskNotificationPayload 
} from '../protocol/messageTypes';
import { findOrCreateAIMessage } from './segmentHandler';

/**
 * Handle INTER_AGENT_MESSAGE event.
 */
export function handleInterAgentMessage(
  payload: InterAgentMessagePayload,
  context: AgentContext
): void {
  const aiMessage = findOrCreateAIMessage(context);
  
  const segment: InterAgentMessageSegment = {
    type: 'inter_agent_message',
    senderAgentId: payload.sender_agent_id,
    recipientRoleName: payload.recipient_role_name,
    content: payload.content,
    messageType: payload.message_type,
  };
  
  aiMessage.segments.push(segment);
}

/**
 * Handle SYSTEM_TASK_NOTIFICATION event.
 */
export function handleSystemTaskNotification(
  payload: SystemTaskNotificationPayload,
  context: AgentContext
): void {
  const aiMessage = findOrCreateAIMessage(context);
  
  const segment: SystemTaskNotificationSegment = {
    type: 'system_task_notification',
    senderId: payload.sender_id,
    content: payload.content,
  };
  
  aiMessage.segments.push(segment);
}
