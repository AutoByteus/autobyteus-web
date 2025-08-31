import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  findOrCreateAIMessage, 
  handleAssistantChunk, 
  handleAssistantCompleteResponse 
} from '../assistantResponseHandler';
import { AgentContext } from '~/types/agent/AgentContext';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation, AIMessage, UserMessage } from '~/types/conversation';
import type { GraphQLAssistantChunkData } from '~/generated/graphql';
import { MediaSegment, ThinkSegment } from '~/utils/aiResponseParser/types';

// Mock the IncrementalAIResponseParser and its context
const mockProcessChunks = vi.fn();
const mockFinalize = vi.fn();
vi.mock('~/utils/aiResponseParser/incrementalAIResponseParser', () => ({
  IncrementalAIResponseParser: vi.fn(() => ({
    processChunks: mockProcessChunks,
    finalize: mockFinalize,
  })),
}));

vi.mock('~/utils/aiResponseParser/stateMachine/ParserContext', () => ({
  ParserContext: vi.fn(),
}));

const createMockAgentContext = (): AgentContext => {
  const conversation: Conversation = {
    id: 'agent-123',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const agentState = new AgentRunState('agent-123', conversation);
  const agentConfig: AgentRunConfig = {
    launchProfileId: 'lp-1',
    workspaceId: 'ws-1',
    llmModelIdentifier: 'test-model',
    autoExecuteTools: false,
    parseToolCalls: true,
    useXmlToolFormat: false,
  };
  return new AgentContext(agentConfig, agentState);
};

describe('assistantResponseHandler', () => {
  let mockAgentContext: AgentContext;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAgentContext = createMockAgentContext();
  });

  describe('findOrCreateAIMessage', () => {
    it('should create a new AI message if none exists', () => {
      expect(mockAgentContext.conversation.messages).toHaveLength(0);
      const aiMessage = findOrCreateAIMessage(mockAgentContext);
      expect(mockAgentContext.conversation.messages).toHaveLength(1);
      expect(aiMessage.type).toBe('ai');
      expect(aiMessage.isComplete).toBe(false);
      expect(aiMessage.parserInstance).toBeDefined();
    });

    it('should return the existing AI message if it is not complete', () => {
      const existingMessage = findOrCreateAIMessage(mockAgentContext);
      const sameMessage = findOrCreateAIMessage(mockAgentContext);
      expect(mockAgentContext.conversation.messages).toHaveLength(1);
      expect(sameMessage).toBe(existingMessage);
    });

    it('should create a new AI message if the last one is complete', () => {
      const firstMessage = findOrCreateAIMessage(mockAgentContext);
      firstMessage.isComplete = true;
      const newMessage = findOrCreateAIMessage(mockAgentContext);
      expect(mockAgentContext.conversation.messages).toHaveLength(2);
      expect(newMessage).not.toBe(firstMessage);
    });
  });

  describe('handleAssistantChunk', () => {
    it('should process reasoning and create a think segment', () => {
      const eventData: GraphQLAssistantChunkData = {
        __typename: 'GraphQLAssistantChunkData',
        reasoning: 'Thinking...',
        content: null,
        is_complete: false,
        usage: null,
        image_urls: null,
        audio_urls: null,
        video_urls: null
      };
      handleAssistantChunk(eventData, mockAgentContext);
      const aiMessage = mockAgentContext.lastAIMessage!;
      expect(aiMessage.segments).toHaveLength(1);
      const thinkSegment = aiMessage.segments[0] as ThinkSegment;
      expect(thinkSegment.type).toBe('think');
      expect(thinkSegment.content).toBe('Thinking...');
    });

    it('should process content by calling the parser instance', () => {
      const eventData: GraphQLAssistantChunkData = {
        __typename: 'GraphQLAssistantChunkData',
        content: 'Hello',
        reasoning: null,
        is_complete: false,
        usage: null,
        image_urls: null,
        audio_urls: null,
        video_urls: null
      };
      handleAssistantChunk(eventData, mockAgentContext);
      expect(mockProcessChunks).toHaveBeenCalledWith(['Hello']);
    });

    it('should finalize parser and set completion status when isComplete is true', () => {
        const userMessage: UserMessage = { type: 'user', text: 'hi', timestamp: new Date() };
        mockAgentContext.conversation.messages.push(userMessage);

        const eventData: GraphQLAssistantChunkData = {
            __typename: 'GraphQLAssistantChunkData',
            isComplete: true,
            usage: { __typename: 'GraphQLTokenUsage', promptTokens: 10, completionTokens: 20, totalTokens: 30, promptCost: 0.01, completionCost: 0.02, totalCost: 0.03 },
            content: null,
            reasoning: null,
            image_urls: null,
            audio_urls: null,
            video_urls: null
        };
        handleAssistantChunk(eventData, mockAgentContext);

        const aiMessage = mockAgentContext.lastAIMessage!;
        expect(aiMessage.isComplete).toBe(true);
        expect(mockFinalize).toHaveBeenCalled();
        expect(userMessage.promptTokens).toBe(10);
        expect(userMessage.promptCost).toBe(0.01);
        expect(aiMessage.completionTokens).toBe(20);
        expect(aiMessage.completionCost).toBe(0.02);
    });
  });

  describe('handleAssistantCompleteResponse', () => {
    it('should mark message as complete and assign token usage', () => {
      const userMessage: UserMessage = { type: 'user', text: 'hi', timestamp: new Date() };
      mockAgentContext.conversation.messages.push(userMessage);
      const aiMessage = findOrCreateAIMessage(mockAgentContext);
      expect(aiMessage.isComplete).toBe(false);

      handleAssistantCompleteResponse({
        __typename: 'GraphQLAssistantCompleteResponseData',
        usage: { __typename: 'GraphQLTokenUsage', promptTokens: 15, completionTokens: 25, totalTokens: 40, promptCost: 0.015, completionCost: 0.025, totalCost: 0.04 },
        content: '',
        reasoning: null,
        image_urls: null,
        audio_urls: null,
        video_urls: null
      }, mockAgentContext);
      
      expect(aiMessage.isComplete).toBe(true);
      expect(mockFinalize).toHaveBeenCalled();
      expect(userMessage.promptTokens).toBe(15);
      expect(userMessage.promptCost).toBe(0.015);
      expect(aiMessage.completionTokens).toBe(25);
      expect(aiMessage.completionCost).toBe(0.025);
    });

    it('should create a media segment for image URLs', () => {
      // FIX: Ensure an AI message exists before calling the handler.
      findOrCreateAIMessage(mockAgentContext);

      handleAssistantCompleteResponse({
        __typename: 'GraphQLAssistantCompleteResponseData',
        imageUrls: ['http://example.com/image.jpg'],
        content: '',
        reasoning: null,
        usage: null,
        audio_urls: null,
        video_urls: null
      }, mockAgentContext);
      const aiMessage = mockAgentContext.lastAIMessage!;
      expect(aiMessage.segments).toHaveLength(1);
      const mediaSegment = aiMessage.segments[0] as MediaSegment;
      expect(mediaSegment.type).toBe('media');
      expect(mediaSegment.mediaType).toBe('image');
      expect(mediaSegment.urls).toEqual(['http://example.com/image.jpg']);
    });

    it('should merge consecutive image URLs into the same media segment', () => {
      const aiMessage = findOrCreateAIMessage(mockAgentContext);
      const existingMediaSegment: MediaSegment = {type: 'media', mediaType: 'image', urls: ['/img1.png']};
      aiMessage.segments.push(existingMediaSegment);

      handleAssistantCompleteResponse({
        __typename: 'GraphQLAssistantCompleteResponseData',
        imageUrls: ['/img2.png'],
        content: '',
        reasoning: null,
        usage: null,
        audio_urls: null,
        video_urls: null
      }, mockAgentContext);

      expect(aiMessage.segments).toHaveLength(1); // Should still be one segment
      const mediaSegment = aiMessage.segments[0] as MediaSegment;
      expect(mediaSegment.urls).toEqual(['/img1.png', '/img2.png']);
    });

    it('should create separate segments for different media types', () => {
      const aiMessage = findOrCreateAIMessage(mockAgentContext);
      const existingMediaSegment: MediaSegment = {type: 'media', mediaType: 'image', urls: ['/img1.png']};
      aiMessage.segments.push(existingMediaSegment);

      handleAssistantCompleteResponse({
        __typename: 'GraphQLAssistantCompleteResponseData',
        videoUrls: ['/vid1.mp4'],
        content: '',
        reasoning: null,
        usage: null,
        image_urls: null,
        audio_urls: null
      }, mockAgentContext);

      expect(aiMessage.segments).toHaveLength(2);
      const imageSegment = aiMessage.segments[0] as MediaSegment;
      const videoSegment = aiMessage.segments[1] as MediaSegment;
      expect(imageSegment.mediaType).toBe('image');
      expect(videoSegment.mediaType).toBe('video');
    });

    it('should not throw if there is no preceding AI message', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(() => {
        handleAssistantCompleteResponse({
          __typename: 'GraphQLAssistantCompleteResponseData',
          usage: null,
          content: '',
          reasoning: null,
          image_urls: null,
          audio_urls: null,
          video_urls: null
        }, mockAgentContext);
      }).not.toThrow();
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });
});
