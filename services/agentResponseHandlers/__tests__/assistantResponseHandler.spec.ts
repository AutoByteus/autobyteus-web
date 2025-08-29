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
    useXmlToolFormat: false, // FIX: Added missing property
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
      };
      handleAssistantChunk(eventData, mockAgentContext);
      expect(mockProcessChunks).toHaveBeenCalledWith(['Hello']);
    });

    it('should create a media segment for image URLs', () => {
      const eventData: GraphQLAssistantChunkData = {
        __typename: 'GraphQLAssistantChunkData',
        imageUrls: ['http://example.com/image.jpg'],
      };
      handleAssistantChunk(eventData, mockAgentContext);
      const aiMessage = mockAgentContext.lastAIMessage!;
      expect(aiMessage.segments).toHaveLength(1);
      const mediaSegment = aiMessage.segments[0] as MediaSegment;
      expect(mediaSegment.type).toBe('media');
      expect(mediaSegment.mediaType).toBe('image');
      expect(mediaSegment.urls).toEqual(['http://example.com/image.jpg']);
    });

    it('should merge consecutive image URLs into the same media segment', () => {
      const event1: GraphQLAssistantChunkData = { imageUrls: ['/img1.png'] };
      const event2: GraphQLAssistantChunkData = { imageUrls: ['/img2.png'] };
      
      handleAssistantChunk(event1, mockAgentContext);
      handleAssistantChunk(event2, mockAgentContext);

      const aiMessage = mockAgentContext.lastAIMessage!;
      expect(aiMessage.segments).toHaveLength(1); // Should be one segment
      const mediaSegment = aiMessage.segments[0] as MediaSegment;
      expect(mediaSegment.type).toBe('media');
      expect(mediaSegment.mediaType).toBe('image');
      expect(mediaSegment.urls).toEqual(['/img1.png', '/img2.png']);
    });

    it('should create separate segments for different media types', () => {
      const event1: GraphQLAssistantChunkData = { imageUrls: ['/img1.png'] };
      const event2: GraphQLAssistantChunkData = { videoUrls: ['/vid1.mp4'] };
      
      handleAssistantChunk(event1, mockAgentContext);
      handleAssistantChunk(event2, mockAgentContext);

      const aiMessage = mockAgentContext.lastAIMessage!;
      expect(aiMessage.segments).toHaveLength(2);
      const imageSegment = aiMessage.segments[0] as MediaSegment;
      const videoSegment = aiMessage.segments[1] as MediaSegment;
      expect(imageSegment.mediaType).toBe('image');
      expect(videoSegment.mediaType).toBe('video');
    });

    it('should correctly interleave text processing and media segments', () => {
      const event1: GraphQLAssistantChunkData = { content: 'Here is an image: ' };
      const event2: GraphQLAssistantChunkData = { imageUrls: ['/img1.png'] };
      const event3: GraphQLAssistantChunkData = { content: ' And here is audio.' };
      const event4: GraphQLAssistantChunkData = { audioUrls: ['/aud1.mp3'] };

      handleAssistantChunk(event1, mockAgentContext);
      handleAssistantChunk(event2, mockAgentContext);
      handleAssistantChunk(event3, mockAgentContext);
      handleAssistantChunk(event4, mockAgentContext);

      expect(mockProcessChunks).toHaveBeenCalledWith(['Here is an image: ']);
      expect(mockProcessChunks).toHaveBeenCalledWith([' And here is audio.']);
      
      const aiMessage = mockAgentContext.lastAIMessage!;
      // Note: parser mock doesn't add text segments, so we only check media
      const mediaSegments = aiMessage.segments.filter(s => s.type === 'media') as MediaSegment[];
      expect(mediaSegments).toHaveLength(2);
      expect(mediaSegments[0].mediaType).toBe('image');
      expect(mediaSegments[1].mediaType).toBe('audio');
    });

    it('should finalize parser and set completion status when isComplete is true', () => {
        const userMessage: UserMessage = { type: 'user', text: 'hi', timestamp: new Date() };
        mockAgentContext.conversation.messages.push(userMessage);

        const eventData: GraphQLAssistantChunkData = {
            __typename: 'GraphQLAssistantChunkData',
            isComplete: true,
            usage: { promptTokens: 10, completionTokens: 20, promptCost: 0.01, completionCost: 0.02 },
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
        usage: { promptTokens: 15, completionTokens: 25, promptCost: 0.015, completionCost: 0.025 },
      }, mockAgentContext);
      
      expect(aiMessage.isComplete).toBe(true);
      expect(mockFinalize).toHaveBeenCalled();
      expect(userMessage.promptTokens).toBe(15);
      expect(userMessage.promptCost).toBe(0.015);
      expect(aiMessage.completionTokens).toBe(25);
      expect(aiMessage.completionCost).toBe(0.025);
    });

    it('should not throw if there is no preceding AI message', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(() => {
        handleAssistantCompleteResponse({
          __typename: 'GraphQLAssistantCompleteResponseData',
          usage: null
        }, mockAgentContext);
      }).not.toThrow();
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });
});
