/**
 * Tool event handlers - Business logic for TOOL_* events.
 * 
 * Layer 3 of the agent streaming architecture - pure functions that
 * handle tool lifecycle events and update segment state.
 */

import type { AgentContext } from '~/types/agent/AgentContext';
import type { ToolCallSegment, WriteFileSegment, TerminalCommandSegment } from '~/types/segments';
import type { 
  ToolApprovalRequestedPayload, 
  ToolAutoExecutingPayload, 
  ToolLogPayload 
} from '../protocol/messageTypes';
import { findSegmentById } from './segmentHandler';

/**
 * Handle TOOL_APPROVAL_REQUESTED event.
 * 
 * Note: invocation_id === segment_id (backend guarantees this)
 */
export function handleToolApprovalRequested(
  payload: ToolApprovalRequestedPayload,
  context: AgentContext
): void {
  const segment = findToolLifecycleSegment(context, payload.invocation_id);
  if (!segment) {
    console.warn(`Tool segment not found for approval request: ${payload.invocation_id}`);
    return;
  }

  segment.status = 'awaiting-approval';
  // Update arguments if not already set
  if (Object.keys(segment.arguments).length === 0) {
    segment.arguments = payload.arguments;
  }
  if (!segment.toolName) {
    segment.toolName = payload.tool_name;
  }
  hydrateSegmentContentFromArguments(segment, payload.arguments);
}

/**
 * Handle TOOL_AUTO_EXECUTING event.
 */
export function handleToolAutoExecuting(
  payload: ToolAutoExecutingPayload,
  context: AgentContext
): void {
  const segment = findToolLifecycleSegment(context, payload.invocation_id);
  if (!segment) {
    console.warn(`Tool segment not found for auto-execution: ${payload.invocation_id}`);
    return;
  }

  segment.status = 'executing';
  if (Object.keys(segment.arguments).length === 0) {
    segment.arguments = payload.arguments;
  }
  if (!segment.toolName) {
    segment.toolName = payload.tool_name;
  }
  hydrateSegmentContentFromArguments(segment, payload.arguments);
}

/**
 * Handle TOOL_LOG event.
 */
export function handleToolLog(
  payload: ToolLogPayload,
  context: AgentContext
): void {
  const segment = findToolLifecycleSegment(context, payload.tool_invocation_id);
  if (!segment) {
    console.warn(`Tool segment not found for log: ${payload.tool_invocation_id}`);
    return;
  }

  // Append log
  segment.logs.push(payload.log_entry);

  // Parse log for result/error status
  const result = parseResultFromLog(payload.log_entry);
  if (result !== null) {
    segment.status = 'success';
    segment.result = result;
    segment.error = null;
    return;
  }

  const error = parseErrorFromLog(payload.log_entry);
  if (error !== null) {
    segment.status = 'error';
    segment.error = error;
    segment.result = null;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find a ToolCallSegment by invocation ID.
 */
function findToolLifecycleSegment(
  context: AgentContext,
  invocationId: string
): ToolCallSegment | WriteFileSegment | TerminalCommandSegment | null {
  const segment = findSegmentById(context, invocationId);
  if (
    segment?.type === 'tool_call' ||
    segment?.type === 'write_file' ||
    segment?.type === 'terminal_command'
  ) {
    return segment as ToolCallSegment | WriteFileSegment | TerminalCommandSegment;
  }
  return null;
}

/**
 * Parse a success result from a tool log entry.
 */
function parseResultFromLog(logEntry: string): any | null {
  // Check for TOOL_RESULT_SUCCESS_PROCESSED
  if (logEntry.startsWith('[TOOL_RESULT_SUCCESS_PROCESSED]')) {
    const resultMatch = logEntry.match(/Result:\s*([\s\S]*)$/);
    if (resultMatch?.[1]) {
      const resultString = resultMatch[1].trim();
      try {
        return JSON.parse(resultString);
      } catch {
        return resultString;
      }
    }
  }

  // Check for APPROVED_TOOL_RESULT and TOOL_RESULT_DIRECT
  const directResultMatch = logEntry.match(/\[(?:APPROVED_TOOL_RESULT|TOOL_RESULT_DIRECT)\]\s*([\s\S]*)/);
  if (directResultMatch?.[1]) {
    const resultString = directResultMatch[1].trim();
    try {
      return JSON.parse(resultString);
    } catch {
      return resultString;
    }
  }

  return null;
}

/**
 * Parse an error from a tool log entry.
 */
function parseErrorFromLog(logEntry: string): string | null {
  const errorPrefixes = [
    '[APPROVED_TOOL_ERROR]',
    '[TOOL_ERROR_DIRECT]',
    '[APPROVED_TOOL_EXCEPTION]',
    '[TOOL_EXCEPTION_DIRECT]',
  ];
  
  for (const prefix of errorPrefixes) {
    if (logEntry.startsWith(prefix)) {
      return logEntry.substring(prefix.length).trim();
    }
  }
  
  return null;
}

function hydrateSegmentContentFromArguments(
  segment: ToolCallSegment | WriteFileSegment | TerminalCommandSegment,
  argumentsPayload: Record<string, any>
): void {
  if (segment.type === 'terminal_command' && !segment.command && argumentsPayload?.command) {
    segment.command = String(argumentsPayload.command);
  }
  if (segment.type === 'write_file' && !segment.originalContent && argumentsPayload?.content) {
    segment.originalContent = String(argumentsPayload.content);
  }
  if (segment.type === 'write_file' && !segment.path && argumentsPayload?.path) {
    segment.path = String(argumentsPayload.path);
  }
}
