/**
 * Tool event handlers - Business logic for TOOL_* events.
 * 
 * Layer 3 of the agent streaming architecture - pure functions that
 * handle tool lifecycle events and update segment state.
 */

import type { AgentContext } from '~/types/agent/AgentContext';
import type { ToolCallSegment, WriteFileSegment, TerminalCommandSegment, PatchFileSegment } from '~/types/segments';
import type { 
  ToolApprovalRequestedPayload, 
  ToolAutoExecutingPayload, 
  ToolLogPayload 
} from '../protocol/messageTypes';
import { findSegmentById } from './segmentHandler';
import { useAgentActivityStore } from '~/stores/agentActivityStore';

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

  // Sidecar Store Update
  const activityStore = useAgentActivityStore();
  activityStore.updateActivityStatus(context.state.agentId, payload.invocation_id, 'awaiting-approval');
  activityStore.updateActivityArguments(context.state.agentId, payload.invocation_id, payload.arguments);

  // Auto-highlight tools awaiting approval (including write_file since streaming is done)
  activityStore.setHighlightedActivity(context.state.agentId, payload.invocation_id);
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

  // Sidecar Store Update
  const activityStore = useAgentActivityStore();
  activityStore.updateActivityStatus(context.state.agentId, payload.invocation_id, 'executing');
  activityStore.updateActivityArguments(context.state.agentId, payload.invocation_id, payload.arguments);

  // Auto-highlight executing tools (except write_file which shows artifacts)
  if (segment.type !== 'write_file') {
    activityStore.setHighlightedActivity(context.state.agentId, payload.invocation_id);
  }
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

  const info = { result: null as any, error: null as string | null, status: null as any };

  // Parse log for result/error status
  const maybeResult = parseResultFromLog(payload.log_entry);
  if (maybeResult !== null) {
    segment.status = 'success';
    segment.result = maybeResult;
    segment.error = null;
    info.result = maybeResult;
    info.status = 'success';
  } else {
    const maybeError = parseErrorFromLog(payload.log_entry);
    if (maybeError !== null) {
      segment.status = 'error';
      segment.error = maybeError;
      segment.result = null;
      info.error = maybeError;
      info.status = 'error';
    }
  }

  // Sidecar Store Update
  const activityStore = useAgentActivityStore();
  activityStore.addActivityLog(context.state.agentId, payload.tool_invocation_id, payload.log_entry);
  if (info.status) {
    activityStore.updateActivityStatus(context.state.agentId, payload.tool_invocation_id, info.status);
    activityStore.setActivityResult(context.state.agentId, payload.tool_invocation_id, info.result, info.error);
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
): ToolCallSegment | WriteFileSegment | TerminalCommandSegment | PatchFileSegment | null {
  const segment = findSegmentById(context, invocationId);
  if (
    segment?.type === 'tool_call' ||
    segment?.type === 'write_file' ||
    segment?.type === 'terminal_command' ||
    segment?.type === 'patch_file'
  ) {
    return segment as ToolCallSegment | WriteFileSegment | TerminalCommandSegment | PatchFileSegment;
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
  segment: ToolCallSegment | WriteFileSegment | TerminalCommandSegment | PatchFileSegment,
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
  if (segment.type === 'patch_file' && !segment.originalContent && argumentsPayload?.patch) {
    segment.originalContent = String(argumentsPayload.patch);
  }
  if (segment.type === 'patch_file' && !segment.path && argumentsPayload?.path) {
    segment.path = String(argumentsPayload.path);
  }
}
