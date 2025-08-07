import { describe, it, expect, beforeEach, vi } from 'vitest';
import { processAgentResponseEvent } from '../agentResponseProcessor';
import * as assistantHandler from '../agentResponseHandlers/assistantResponseHandler';
import * as toolCallHandler from '../agentResponseHandlers/toolCallHandler';
import * as statusHandler from '../agentResponseHandlers/phaseTransitionHandler';
import { AgentContext } from '~/types/agent/AgentContext';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation } from '~/types/conversation';
import type { AgentResponseSubscription } from '~/generated/graphql';

// Mock the dependencies (the actual handlers)
vi.mock('../agentResponseHandlers/assistantResponseHandler', () => ({
  handleAssistantChunk: vi.fn(),
  handleAssistantCompleteResponse: vi.fn(),
}));

vi.mock('../agentResponseHandlers/toolCallHandler', () => ({
  handleToolInvocationApprovalRequested: vi.fn(),
  handleToolInvocationAutoExecuting: vi.fn(),
  handleToolInteractionLog: vi.fn(),
}));

vi.mock('../agentResponseHandlers/phaseTransitionHandler', () => ({
  handleAgentPhaseTransition: vi.fn(),
}));


const createMockAgentContext = (): AgentContext => {
  const conversation: Conversation = {
    id: 'agent-123',
    messages: [],
    createdAt: new Date('2023-01-01T12:00:00.000Z').toISOString(),
    updatedAt: new Date('2023-01-01T12:00:00.000Z').toISOString(),
  };
  const agentState = new AgentRunState('agent-123', conversation);
  const agentConfig: AgentRunConfig = {
    launchProfileId: 'lp-1',
    workspaceId: 'ws-1',
    llmModelIdentifier: 'test-model',
    autoExecuteTools: false,
    parseToolCalls: true,
  };
  return new AgentContext(agentConfig, agentState);
};

describe('processAgentResponseEvent', () => {
  let mockAgentContext: AgentContext;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAgentContext = createMockAgentContext();
  });

  it('should call handleAssistantChunk for GraphQLAssistantChunkData', () => {
    const eventData: AgentResponseSubscription['agentResponse']['data'] = {
      __typename: 'GraphQLAssistantChunkData',
      content: 'hello',
    };
    processAgentResponseEvent(eventData, mockAgentContext);
    expect(assistantHandler.handleAssistantChunk).toHaveBeenCalledWith(eventData, mockAgentContext);
    expect(mockAgentContext.conversation.updatedAt).not.toBe(new Date('2023-01-01T12:00:00.000Z').toISOString());
  });

  it('should call handleAssistantCompleteResponse for GraphQLAssistantCompleteResponseData', () => {
    const eventData: AgentResponseSubscription['agentResponse']['data'] = {
      __typename: 'GraphQLAssistantCompleteResponseData',
      usage: { promptTokens: 10, completionTokens: 20, promptCost: 0.01, completionCost: 0.02 },
    };
    processAgentResponseEvent(eventData, mockAgentContext);
    expect(assistantHandler.handleAssistantCompleteResponse).toHaveBeenCalledWith(eventData, mockAgentContext);
  });

  it('should call handleToolInvocationApprovalRequested for GraphQLToolInvocationApprovalRequestedData', () => {
    const eventData: AgentResponseSubscription['agentResponse']['data'] = {
      __typename: 'GraphQLToolInvocationApprovalRequestedData',
      invocationId: 'invoke-1',
    };
    processAgentResponseEvent(eventData, mockAgentContext);
    expect(toolCallHandler.handleToolInvocationApprovalRequested).toHaveBeenCalledWith(eventData, mockAgentContext);
  });

  it('should call handleToolInvocationAutoExecuting for GraphQLToolInvocationAutoExecutingData', () => {
    const eventData: AgentResponseSubscription['agentResponse']['data'] = {
      __typename: 'GraphQLToolInvocationAutoExecutingData',
      invocationId: 'invoke-2',
    };
    processAgentResponseEvent(eventData, mockAgentContext);
    expect(toolCallHandler.handleToolInvocationAutoExecuting).toHaveBeenCalledWith(eventData, mockAgentContext);
  });

  it('should call handleToolInteractionLog for GraphQLToolInteractionLogEntryData', () => {
    const eventData: AgentResponseSubscription['agentResponse']['data'] = {
      __typename: 'GraphQLToolInteractionLogEntryData',
      toolInvocationId: 'invoke-3',
      logEntry: 'Executing tool...',
    };
    processAgentResponseEvent(eventData, mockAgentContext);
    expect(toolCallHandler.handleToolInteractionLog).toHaveBeenCalledWith(eventData, mockAgentContext);
  });

  it('should call handleAgentPhaseTransition for GraphQLAgentOperationalPhaseTransitionData', () => {
    const eventData: AgentResponseSubscription['agentResponse']['data'] = {
      __typename: 'GraphQLAgentOperationalPhaseTransitionData',
      newPhase: 'EXECUTING_TOOL',
    };
    processAgentResponseEvent(eventData, mockAgentContext);
    expect(statusHandler.handleAgentPhaseTransition).toHaveBeenCalledWith(eventData, mockAgentContext);
  });

  it('should handle GraphQLErrorEventData without calling other handlers', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const eventData: AgentResponseSubscription['agentResponse']['data'] = {
      __typename: 'GraphQLErrorEventData',
      message: 'Something went wrong',
      details: 'Error details',
    };
    processAgentResponseEvent(eventData, mockAgentContext);
    expect(assistantHandler.handleAssistantChunk).not.toHaveBeenCalled();
    expect(toolCallHandler.handleToolInteractionLog).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
