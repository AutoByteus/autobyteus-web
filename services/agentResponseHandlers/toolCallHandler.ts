import type {
  GraphQLToolInvocationApprovalRequestedData,
  GraphQLToolInvocationAutoExecutingData,
  GraphQLToolInteractionLogEntryData,
} from '~/generated/graphql';
import type { AgentContext } from '~/types/agent/AgentContext';
import type { ToolCallSegment } from '~/utils/aiResponseParser/types';

/**
 * Finds a specific ToolCallSegment within a conversation by its invocationId.
 * @param agentContext The agent context containing the conversation to search within.
 * @param invocationId The ID of the tool invocation to find.
 * @returns The ToolCallSegment if found, otherwise null.
 */
function findToolCallSegment(agentContext: AgentContext, invocationId: string): ToolCallSegment | null {
  for (const message of agentContext.conversation.messages) {
    if (message.type === 'ai') {
      for (const segment of message.segments) {
        if (segment.type === 'tool_call' && segment.invocationId === invocationId) {
          return segment;
        }
      }
    }
  }
  return null;
}

export function handleToolInvocationApprovalRequested(
  data: GraphQLToolInvocationApprovalRequestedData,
  agentContext: AgentContext
): void {
  const segment = findToolCallSegment(agentContext, data.invocationId);
  if (segment) {
    segment.status = 'awaiting-approval';
  } else {
    console.warn(`ToolCallSegment with invocationId ${data.invocationId} not found for approval request.`);
  }
}

export function handleToolInvocationAutoExecuting(
  data: GraphQLToolInvocationAutoExecutingData,
  agentContext: AgentContext
): void {
  const segment = findToolCallSegment(agentContext, data.invocationId);
  if (segment) {
    segment.status = 'executing';
  } else {
    console.warn(`ToolCallSegment with invocationId ${data.invocationId} not found for auto-execution.`);
  }
}

function parseResultFromLog(logEntry: string): any | null {
    // New check for TOOL_RESULT_SUCCESS_PROCESSED, which is a definitive success marker.
    if (logEntry.startsWith('[TOOL_RESULT_SUCCESS_PROCESSED]')) {
        const resultMatch = logEntry.match(/Result:\s*([\s\S]*)$/);
        if (resultMatch && typeof resultMatch[1] === 'string') {
            const resultString = resultMatch[1].trim();
            try {
                // Attempt to parse the result as JSON
                return JSON.parse(resultString);
            } catch (e) {
                // If not JSON, return the raw string result
                return resultString;
            }
        }
    }

    // Existing check for APPROVED_TOOL_RESULT and TOOL_RESULT_DIRECT
    const directResultMatch = logEntry.match(/\[(?:APPROVED_TOOL_RESULT|TOOL_RESULT_DIRECT)\]\s*([\s\S]*)/);
    if (directResultMatch && typeof directResultMatch[1] === 'string') {
        const resultString = directResultMatch[1].trim();
        try {
            // Attempt to parse the captured group as JSON
            return JSON.parse(resultString);
        } catch (e) {
            // If it fails, it might be a simple string result.
            return resultString;
        }
    }

    return null;
}

function parseErrorFromLog(logEntry: string): string | null {
    const errorPrefixes = [
        '[APPROVED_TOOL_ERROR]',
        '[TOOL_ERROR_DIRECT]',
        '[APPROVED_TOOL_EXCEPTION]',
        '[TOOL_EXCEPTION_DIRECT]'
    ];
    for (const prefix of errorPrefixes) {
        if (logEntry.startsWith(prefix)) {
            return logEntry.substring(prefix.length).trim();
        }
    }
    return null;
}


export function handleToolInteractionLog(
  data: GraphQLToolInteractionLogEntryData,
  agentContext: AgentContext
): void {
  const segment = findToolCallSegment(agentContext, data.toolInvocationId);
  if (segment) {
    // Always append the raw log
    segment.logs.push(data.logEntry);

    // Check for success state
    const result = parseResultFromLog(data.logEntry);
    if (result !== null) {
        segment.status = 'success';
        segment.result = result;
        segment.error = null;
        return; // Final state, no need to check for errors
    }

    // Check for error state
    const error = parseErrorFromLog(data.logEntry);
    if (error !== null) {
        segment.status = 'error';
        segment.error = error;
        segment.result = null;
        return; // Final state
    }
  }
}
