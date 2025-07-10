import type { GraphQLAssistantChunkData, GraphQLAssistantCompleteResponseData } from '~/generated/graphql';
import type { Conversation, AIMessage, UserMessage } from '~/types/conversation';
import type { ThinkSegment } from '~/utils/aiResponseParser/types';
import { IncrementalAIResponseParser } from '~/utils/aiResponseParser/incrementalAIResponseParser';
import { useLLMProviderConfigStore } from '~/stores/llmProviderConfig';

/**
 * Finds the last AI message in the conversation or creates a new one if needed.
 * This is typically done at the start of processing a new stream of AI responses.
 * @param conversation The conversation object.
 * @returns The active AIMessage.
 */
function findOrCreateAIMessage(conversation: Conversation): AIMessage {
  let lastMessage = conversation.messages[conversation.messages.length - 1] as AIMessage | undefined;

  if (!lastMessage || lastMessage.type !== 'ai' || lastMessage.isComplete) {
    const llmProviderStore = useLLMProviderConfigStore();
    const provider = llmProviderStore.getProviderForModel(conversation.llmModelName || '');
    const useXml = conversation.useXmlToolFormat ?? false;
    const newAiMessage: AIMessage = {
      type: 'ai',
      text: '',
      timestamp: new Date(),
      chunks: [],
      isComplete: false,
      segments: [],
      parserInstance: new IncrementalAIResponseParser([], provider ?? undefined, useXml),
    };
    newAiMessage.parserInstance = new IncrementalAIResponseParser(newAiMessage.segments, provider ?? undefined, useXml);
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
