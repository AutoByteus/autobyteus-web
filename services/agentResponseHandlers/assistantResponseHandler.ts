import type { GraphQLAssistantChunkData, GraphQLAssistantCompleteResponseData } from '~/generated/graphql';
import type { AIMessage, UserMessage } from '~/types/conversation';
import type { AgentContext } from '~/types/agent/AgentContext';
import type { ThinkSegment, AIResponseSegment, MediaSegment } from '~/utils/aiResponseParser/types';
import { IncrementalAIResponseParser } from '~/utils/aiResponseParser/incrementalAIResponseParser';
import { ParserContext } from '~/utils/aiResponseParser/stateMachine/ParserContext';

/**
 * Finds the last AI message in the conversation or creates a new one if needed.
 * This is typically done at the start of processing a new stream of AI responses.
 * @param agentContext The full context for the agent run.
 * @returns The active AIMessage.
 */
export function findOrCreateAIMessage(agentContext: AgentContext): AIMessage {
  let lastMessage = agentContext.lastAIMessage;

  if (!lastMessage || lastMessage.isComplete) {
    const segments: AIResponseSegment[] = [];

    const newAiMessage: AIMessage = {
      type: 'ai',
      text: '',
      timestamp: new Date(),
      chunks: [],
      isComplete: false,
      segments: segments,
      parserInstance: null as any, // Will be set below
    };

    // Add the message directly to the conversation of the provided context.
    agentContext.conversation.messages.push(newAiMessage);
    agentContext.conversation.updatedAt = new Date().toISOString();

    // Now that the message is in place, create the parser context
    const parserContext = new ParserContext(agentContext);
    const parser = new IncrementalAIResponseParser(parserContext);
    
    // Assign the parser instance back to the message
    newAiMessage.parserInstance = parser;

    lastMessage = newAiMessage;
  }

  return lastMessage;
}

/**
 * Finds/creates a 'think' segment and appends content.
 * @param message The AI message to modify.
 * @param reasoningChunk The reasoning text to append.
 */
function updateThinkSegment(message: AIMessage, reasoningChunk: string): void {
  let thinkSegment = message.segments.find((s) => s.type === 'think') as ThinkSegment | undefined;

  if (!thinkSegment) {
    thinkSegment = { type: 'think', content: '' };
    message.segments.push(thinkSegment); // FIX: Changed from unshift to push for chronological order.
  }

  thinkSegment.content += reasoningChunk;
}

/**
 * Finds or creates a media segment and appends URLs to it.
 * This function ensures that consecutive media chunks of the same type are merged.
 * @param message The AI message to modify.
 * @param urls The array of media URLs from the event.
 * @param mediaType The type of media ('image', 'audio', or 'video').
 */
function updateMediaSegment(message: AIMessage, urls: readonly string[], mediaType: 'image' | 'audio' | 'video'): void {
  const lastSegment = message.segments.length > 0 ? message.segments[message.segments.length - 1] : null;
  let mediaSegment: MediaSegment | null = null;

  // Merge with the last segment only if it's a media segment of the same type.
  if (lastSegment && lastSegment.type === 'media' && lastSegment.mediaType === mediaType) {
    mediaSegment = lastSegment as MediaSegment;
  }

  if (!mediaSegment) {
    mediaSegment = { type: 'media', mediaType, urls: [] };
    message.segments.push(mediaSegment);
  }
  
  // Add only new URLs to the segment to avoid duplicates from overlapping chunks.
  for (const url of urls) {
    if (!mediaSegment.urls.includes(url)) {
      mediaSegment.urls.push(url);
    }
  }
}


/**
 * Processes a chunk of an assistant's response, updating the conversation state.
 * This handler is now only responsible for text, reasoning, and finalization signals.
 * Media URLs are handled by `handleAssistantCompleteResponse`.
 * @param eventData The chunk data from the GraphQL subscription.
 * @param agentContext The full context for the agent run.
 */
export function handleAssistantChunk(eventData: GraphQLAssistantChunkData, agentContext: AgentContext): void {
  const aiMessage = findOrCreateAIMessage(agentContext);

  // 1. Process reasoning text.
  if (eventData.reasoning) {
    updateThinkSegment(aiMessage, eventData.reasoning);
  }

  // 2. Process content text.
  if (eventData.content) {
    aiMessage.parserInstance.processChunks([eventData.content]);
  }

  // 3. Media URL processing is REMOVED from the chunk handler.

  // 4. Handle finalization if the chunk is marked as complete.
  if (eventData.isComplete) {
    aiMessage.isComplete = true;
    
    // Finalize the parser to handle any incomplete segments at the end of the stream.
    aiMessage.parserInstance.finalize();

    // A completing chunk might also have the final token usage.
    if (eventData.usage) {
      const userMessage = agentContext.conversation.messages.findLast(m => m.type === 'user') as UserMessage | undefined;
      if (userMessage && eventData.usage.promptTokens != null) {
        userMessage.promptTokens = eventData.usage.promptTokens;
        userMessage.promptCost = eventData.usage.promptCost;
      }
      if (eventData.usage.completionTokens != null) {
        aiMessage.completionTokens = eventData.usage.completionTokens;
        aiMessage.completionCost = eventData.usage.completionCost;
      }
    }
  }
}

/**
 * Processes the final 'complete' event for an assistant's turn. This event is now the
 * single source of truth for final token usage AND media URLs.
 * @param eventData The complete response data from the GraphQL subscription.
 * @param agentContext The full context for the agent run.
 */
export function handleAssistantCompleteResponse(eventData: GraphQLAssistantCompleteResponseData, agentContext: AgentContext): void {
  const lastMessage = agentContext.lastAIMessage;

  if (!lastMessage) {
    console.warn('Received AssistantCompleteResponseData without a preceding AI message. Ignoring.');
    return;
  }

  // Finalize the parser if it hasn't been done already. This can happen if the
  // 'complete' event arrives separately from the last content chunk.
  if (!lastMessage.isComplete) {
    lastMessage.parserInstance.finalize();
  }

  // Mark the message as complete.
  lastMessage.isComplete = true;

  // --- NEW: Process all media URLs from the final response ---
  if (eventData.imageUrls && eventData.imageUrls.length > 0) {
    updateMediaSegment(lastMessage, eventData.imageUrls, 'image');
  }
  if (eventData.audioUrls && eventData.audioUrls.length > 0) {
    updateMediaSegment(lastMessage, eventData.audioUrls, 'audio');
  }
  if (eventData.videoUrls && eventData.videoUrls.length > 0) {
    updateMediaSegment(lastMessage, eventData.videoUrls, 'video');
  }
  // --- END NEW ---


  // Assign final token usage costs.
  if (eventData.usage) {
    const userMessage = agentContext.conversation.messages.findLast(m => m.type === 'user') as UserMessage | undefined;
    if (userMessage && eventData.usage.promptTokens != null) {
      userMessage.promptTokens = eventData.usage.promptTokens;
      userMessage.promptCost = eventData.usage.promptCost;
    }
    if (eventData.usage.completionTokens != null) {
      lastMessage.completionTokens = eventData.usage.completionTokens;
      lastMessage.completionCost = eventData.usage.completionCost;
    }
  }
}
