import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleAgentStatus, handleAssistantComplete, handleError } from '../agentStatusHandler';
import { AgentStatus } from '~/types/agent/AgentStatus';
import type { AgentStatusPayload, AssistantCompletePayload, ErrorPayload } from '../../protocol/messageTypes';

// Mock findOrCreateAIMessage since it's used in handleError
vi.mock('../segmentHandler', () => ({
  findOrCreateAIMessage: vi.fn((context) => {
    // Return the last message if it's AI, or a mock one
    const last = context.conversation.messages[context.conversation.messages.length - 1];
    if (last && last.type === 'ai') return last;
    const newMsg = { type: 'ai', segments: [], isComplete: false };
    context.conversation.messages.push(newMsg);
    return newMsg;
  })
}));

describe('agentStatusHandler', () => {
  let mockContext: any;

  beforeEach(() => {
    mockContext = {
      state: { 
        currentStatus: AgentStatus.Uninitialized 
      },
      isSending: true,
      conversation: {
        messages: []
      }
    };
  });

  describe('handleAgentStatus', () => {
    it('updates currentStatus', () => {
      const payload: AgentStatusPayload = { new_status: 'processing_user_input', old_status: 'idle' };
      handleAgentStatus(payload, mockContext);
      expect(mockContext.state.currentStatus).toBe(AgentStatus.ProcessingUserInput);
    });

    it('sets isSending to false when status is Idle', () => {
      const payload: AgentStatusPayload = { new_status: 'idle', old_status: 'processing_user_input' };
      handleAgentStatus(payload, mockContext);
      expect(mockContext.isSending).toBe(false);
    });

    it('marks last AI message as complete when Idle', () => {
      const aiMsg = { type: 'ai', isComplete: false };
      mockContext.conversation.messages.push(aiMsg);
      
      const payload: AgentStatusPayload = { new_status: 'idle', old_status: 'processing_user_input' };
      handleAgentStatus(payload, mockContext);
      
      expect(aiMsg.isComplete).toBe(true);
    });
  });

  describe('handleAssistantComplete', () => {
    it('marks last AI message as complete', () => {
      const aiMsg = { type: 'ai', isComplete: false };
      mockContext.conversation.messages.push(aiMsg);

      const payload: AssistantCompletePayload = {};
      handleAssistantComplete(payload, mockContext);

      expect(aiMsg.isComplete).toBe(true);
    });
  });

  describe('handleError', () => {
    it('adds error segment and stops sending', () => {
      const payload: ErrorPayload = { code: 'TEST_ERR', message: 'Something went wrong' };
      handleError(payload, mockContext);

      const lastMsg = mockContext.conversation.messages[0];
      expect(lastMsg).toBeDefined();
      expect(lastMsg.segments).toHaveLength(1);
      expect(lastMsg.segments[0]).toEqual({
        type: 'error',
        source: 'TEST_ERR',
        message: 'Something went wrong'
      });
      expect(mockContext.isSending).toBe(false);
    });
  });
});
