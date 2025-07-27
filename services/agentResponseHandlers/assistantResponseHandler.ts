import type { GraphQLAssistantChunkData, GraphQLAssistantCompleteResponseData } from '~/generated/graphql';
import type { Conversation, AIMessage, UserMessage } from '~/types/conversation';
import type { ThinkSegment, AIResponseSegment } from '~/utils/aiResponseParser/types';
import { IncrementalAIResponseParser } from '~/utils/aiResponseParser/incrementalAIResponseParser';
import { useAgentRunStore } from '~/stores/agentRunStore';
import { createParserContext } from '~/utils/aiResponseParser/parserContextFactory';
import type { AgentRunState } from '~/types/agent/AgentRunState';

/**
 * Finds the last AI message in the conversation or creates a new one if needed.
 * This is typically done at the start of processing a new stream of AI responses.
 * @param conversation The conversation object.
 * @returns The active AIMessage.
 */
function findOrCreateAIMessage(conversation: Conversation): AIMessage {
  let lastMessage = conversation.messages[conversation.messages.length - 1] as AIMessage | undefined;

  if (!lastMessage || lastMessage.type !== 'ai' || lastMessage.isComplete) {
    const agentRunStore = useAgentRunStore();
    const runState = agentRunStore.getAgentStateById(conversation.id);

    if (!runState) {
      // This is a critical failure. The context should always exist for an active conversation.
      // Throw an error to make it visible, as parsing cannot proceed correctly without it.
      throw new Error(`Critical: AgentRunState not found for agent ${conversation.id}`);
    }
    
    const segments: AIResponseSegment[] = [];
    // REFACTORED: Use the factory to simplify ParserContext creation.
    const parserContext = createParserContext(conversation, segments, runState);
    const parser = new IncrementalAIResponseParser(parserContext);

    const newAiMessage: AIMessage = {
      type: 'ai',
      text: '',
      timestamp: new Date(),
      chunks: [],
      isComplete: false,
      segments: segments, // The parser context will mutate this array
      parserInstance: parser,
    };

    conversation.messages.push(newAiMessage);
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
    message.segments.unshift(thinkSegment); // Place at the beginning for prominent display.
  }

  thinkSegment.content += reasoningChunk;
}

/**
 * Processes a chunk of an assistant's response, updating the conversation state.
 * @param eventData The chunk data from the GraphQL subscription.
 * @param conversation The full conversation object to be mutated.
 */
export function handleAssistantChunk(eventData: GraphQLAssistantChunkData, conversation: Conversation): void {
  const aiMessage = findOrCreateAIMessage(conversation);

  // 1. Process reasoning text.
  if (eventData.reasoning) {
    updateThinkSegment(aiMessage, eventData.reasoning);
  }

  // 2. Process content text.
  if (eventData.content) {
    aiMessage.parserInstance.processChunks([eventData.content]);
  }

  // 3. Handle finalization if the chunk is marked as complete.
  if (eventData.isComplete) {
    aiMessage.isComplete = true;
    
    // Finalize the parser to handle any incomplete segments at the end of the stream.
    aiMessage.parserInstance.finalize();

    // A completing chunk might also have the final token usage.
    if (eventData.usage) {
      const userMessage = conversation.messages.findLast(m => m.type === 'user') as UserMessage | undefined;
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
 * Processes the final 'complete' event for an assistant's turn. This event primarily
 * provides the final token usage statistics.
 * @param eventData The complete response data from the GraphQL subscription.
 * @param conversation The full conversation object to be mutated.
 */
export function handleAssistantCompleteResponse(eventData: GraphQLAssistantCompleteResponseData, conversation: Conversation): void {
  const lastMessage = conversation.messages[conversation.messages.length - 1];

  if (!lastMessage || lastMessage.type !== 'ai') {
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

  // Assign final token usage costs.
  if (eventData.usage) {
    const userMessage = conversation.messages.findLast(m => m.type === 'user') as UserMessage | undefined;
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
