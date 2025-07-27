import type {
  GraphQLToolInvocationApprovalRequestedData,
  GraphQLToolInvocationAutoExecutingData,
  GraphQLToolInteractionLogEntryData,
} from '~/generated/graphql';
import type { Conversation } from '~/types/conversation';
import type { ToolCallSegment } from '~/utils/aiResponseParser/types';

/**
 * Finds a specific ToolCallSegment within a conversation by its invocationId.
 * @param conversation The conversation to search within.
 * @param invocationId The ID of the tool invocation to find.
 * @returns The ToolCallSegment if found, otherwise null.
 */
function findToolCallSegment(conversation: Conversation, invocationId: string): ToolCallSegment | null {
  for (const message of conversation.messages) {
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
  conversation: Conversation
): void {
  const segment = findToolCallSegment(conversation, data.invocationId);
  if (segment) {
    segment.status = 'awaiting-approval';
  } else {
    console.warn(`ToolCallSegment with invocationId ${data.invocationId} not found for approval request.`);
  }
}

export function handleToolInvocationAutoExecuting(
  data: GraphQLToolInvocationAutoExecutingData,
  conversation: Conversation
): void {
  const segment = findToolCallSegment(conversation, data.invocationId);
  if (segment) {
    segment.status = 'executing';
  } else {
    console.warn(`ToolCallSegment with invocationId ${data.invocationId} not found for auto-execution.`);
  }
}

function parseResultFromLog(logEntry: string): any | null {
    const match = logEntry.match(/\[(?:APPROVED_TOOL_RESULT|TOOL_RESULT_DIRECT)\]\s*([\s\S]*)/);
    if (match && match[1]) {
        try {
            // Attempt to parse the captured group as JSON
            return JSON.parse(match[1]);
        } catch (e) {
            // If it fails, it might be a simple string result. Return the captured string.
            return match[1].trim();
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
  conversation: Conversation
): void {
  const segment = findToolCallSegment(conversation, data.toolInvocationId);
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
