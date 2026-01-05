/**
 * Status and other event handlers.
 * 
 * Layer 3 of the agent streaming architecture - handles AGENT_STATUS,
 * TODO_LIST_UPDATE, and ERROR events.
 */

import type { AgentContext } from '~/types/agent/AgentContext';
import type { ErrorSegment } from '~/types/segments';
import type { 
  AgentStatusPayload, 
  ErrorPayload,
  AssistantCompletePayload,
} from '../protocol/messageTypes';
import { findOrCreateAIMessage } from './segmentHandler';
import { AgentStatus } from '~/types/agent/AgentStatus';


/**
 * Handle AGENT_STATUS event.
 */
export function handleAgentStatus(
  payload: AgentStatusPayload,
  context: AgentContext
): void {
  const normalizedStatus = String(payload.new_status || AgentStatus.Uninitialized).toLowerCase();
  context.state.currentStatus = normalizedStatus as AgentStatus;
  
  const shouldStopSending = [
    AgentStatus.Idle,
    AgentStatus.Error,
    AgentStatus.ShutdownComplete,
  ].includes(normalizedStatus as AgentStatus);

  // If status indicates completion, mark the current AI message as complete
  if (normalizedStatus === AgentStatus.Idle) {
    const lastMessage = context.conversation.messages[context.conversation.messages.length - 1];
    if (lastMessage?.type === 'ai') {
      lastMessage.isComplete = true;
    }
  }

  if (shouldStopSending) {
    context.isSending = false;
  }
}

/**
 * Handle ASSISTANT_COMPLETE event.
 * Marks the current AI message as complete so the next response starts a new message.
 */
export function handleAssistantComplete(
  _payload: AssistantCompletePayload,
  context: AgentContext
): void {
  const lastMessage = context.conversation.messages[context.conversation.messages.length - 1];
  if (lastMessage?.type === 'ai') {
    lastMessage.isComplete = true;
  }
}



/**
 * Handle ERROR event.
 */
export function handleError(
  payload: ErrorPayload,
  context: AgentContext
): void {
  const aiMessage = findOrCreateAIMessage(context);
  
  const errorSegment: ErrorSegment = {
    type: 'error',
    source: payload.code,
    message: payload.message,
  };
  
  aiMessage.segments.push(errorSegment);
  aiMessage.isComplete = true;
  context.isSending = false;
}
