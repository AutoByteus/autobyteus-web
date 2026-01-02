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
  TodoListUpdatePayload,
  ErrorPayload 
} from '../protocol/messageTypes';
import { findOrCreateAIMessage } from './segmentHandler';
import { ToDoStatus } from '~/types/todo';

/**
 * Handle AGENT_STATUS event.
 */
export function handleAgentStatus(
  payload: AgentStatusPayload,
  context: AgentContext
): void {
  context.state.currentStatus = payload.new_status;
  
  // If status indicates completion, mark the current AI message as complete
  if (payload.new_status === 'idle') {
    const lastMessage = context.conversation.messages[context.conversation.messages.length - 1];
    if (lastMessage?.type === 'ai') {
      lastMessage.isComplete = true;
    }
  }
}

/**
 * Map backend todo status string to frontend ToDoStatus enum.
 */
function mapTodoStatus(status: string): ToDoStatus {
  const statusLower = status.toLowerCase();
  if (statusLower === 'done' || statusLower === 'completed') {
    return ToDoStatus.DONE;
  }
  if (statusLower === 'in_progress' || statusLower === 'in-progress') {
    return ToDoStatus.IN_PROGRESS;
  }
  return ToDoStatus.PENDING;
}

/**
 * Handle TODO_LIST_UPDATE event.
 */
export function handleTodoListUpdate(
  payload: TodoListUpdatePayload,
  context: AgentContext
): void {
  context.state.todoList = payload.todos.map(todo => ({
    todoId: todo.todo_id,
    description: todo.description,
    status: mapTodoStatus(todo.status),
  }));
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
}
