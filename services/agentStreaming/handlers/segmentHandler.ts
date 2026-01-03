/**
 * Segment event handlers - Business logic for SEGMENT_* events.
 * 
 * Layer 3 of the agent streaming architecture - pure functions that
 * handle segment lifecycle events and update AgentContext state.
 */

import type { AgentContext } from '~/types/agent/AgentContext';
import type { AIMessage } from '~/types/conversation';
import type { AIResponseSegment, ToolCallSegment, WriteFileSegment, TerminalCommandSegment, IframeSegment, ThinkSegment, AIResponseTextSegment, ToolInvocationLifecycle } from '~/types/segments';
import type { SegmentStartPayload, SegmentContentPayload, SegmentEndPayload } from '../protocol/messageTypes';
import { createSegmentFromPayload } from '../protocol/segmentTypes';

/**
 * Handle SEGMENT_START event - creates a new segment and adds it to the current AI message.
 */
export function handleSegmentStart(
  payload: SegmentStartPayload,
  context: AgentContext
): void {
  const aiMessage = findOrCreateAIMessage(context);
  const segment = createSegmentFromPayload(payload);

  // Store segment ID(s) for lookup during CONTENT and END events
  (segment as any)._segmentId = payload.id;

  aiMessage.segments.push(segment);
}

/**
 * Handle SEGMENT_CONTENT event - appends delta content to the segment.
 */
export function handleSegmentContent(
  payload: SegmentContentPayload,
  context: AgentContext
): void {
  const segment = findSegmentById(context, payload.id);
  if (!segment) {
    console.warn(`Segment not found for content event: ${payload.id}`);
    return;
  }

  appendContentToSegment(segment, payload.delta);
}

/**
 * Handle SEGMENT_END event - finalizes the segment with any end metadata.
 */
export function handleSegmentEnd(
  payload: SegmentEndPayload,
  context: AgentContext
): void {
  const segment = findSegmentById(context, payload.id);
  if (!segment) {
    console.warn(`Segment not found for end event: ${payload.id}`);
    return;
  }

  finalizeSegment(segment, payload.metadata);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find or create the current AI message for streaming content.
 */
export function findOrCreateAIMessage(context: AgentContext): AIMessage {
  const lastMessage = context.conversation.messages[context.conversation.messages.length - 1];
  
  if (lastMessage?.type === 'ai' && !lastMessage.isComplete) {
    return lastMessage;
  }

  // Create new AI message
  const newMessage: AIMessage = {
    type: 'ai',
    text: '',
    timestamp: new Date(),
    isComplete: false,
    segments: [],
  };

  context.conversation.messages.push(newMessage);
  context.conversation.updatedAt = new Date().toISOString();

  return newMessage;
}

/**
 * Find a segment by its ID across all messages.
 */
export function findSegmentById(
  context: AgentContext,
  segmentId: string
): AIResponseSegment | null {
  for (let i = context.conversation.messages.length - 1; i >= 0; i--) {
    const message = context.conversation.messages[i];
    if (message.type === 'ai') {
      for (const segment of message.segments) {
        if ((segment as any)._segmentId === segmentId) {
          return segment;
        }
        // Also check invocationId for tool_call segments
        if (segment.type === 'tool_call' && segment.invocationId === segmentId) {
          return segment;
        }
      }
    }
  }
  return null;
}

/**
 * Append content delta to a segment based on its type.
 */
function appendContentToSegment(segment: AIResponseSegment, delta: string): void {
  switch (segment.type) {
    case 'text':
      (segment as AIResponseTextSegment).content += delta;
      break;

    case 'think':
      (segment as ThinkSegment).content += delta;
      break;

    case 'tool_call':
      // Accumulate raw content for display during streaming
      const toolSegment = segment as ToolCallSegment;
      toolSegment.rawContent = (toolSegment.rawContent || '') + delta;
      break;

    case 'write_file':
      (segment as WriteFileSegment).originalContent += delta;
      break;

    case 'terminal_command':
      (segment as TerminalCommandSegment).command += delta;
      break;

    case 'iframe':
      (segment as IframeSegment).content += delta;
      break;

    default:
      console.warn(`Unknown segment type for content append: ${segment.type}`);
  }
}

/**
 * Finalize a segment with end metadata.
 */
function finalizeSegment(
  segment: AIResponseSegment,
  metadata?: Record<string, any>
): void {
  if (segment.type === 'tool_call' || segment.type === 'write_file' || segment.type === 'terminal_command') {
    const toolSegment = segment as ToolInvocationLifecycle;
    if (metadata?.arguments) {
      toolSegment.arguments = metadata.arguments;
    }
    if (metadata?.tool_name) {
      toolSegment.toolName = metadata.tool_name;
    }
    // Transition from 'parsing' to 'parsed' when segment ends
    if (toolSegment.status === 'parsing') {
      toolSegment.status = 'parsed';
    }
  }

  if (segment.type === 'iframe') {
    (segment as IframeSegment).isComplete = true;
  }
}
