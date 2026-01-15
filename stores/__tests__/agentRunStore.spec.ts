import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAgentRunStore } from '../agentRunStore';
import { useAgentContextsStore } from '../agentContextsStore';
import { useConversationHistoryStore } from '../conversationHistory';
import { AgentStreamingService } from '~/services/agentStreaming';

// Mocks
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: vi.fn(() => ({
    client: {
      mutate: vi.fn().mockResolvedValue({
        data: {
          sendAgentUserInput: {
            success: true,
            agentId: 'perm-agent-id',
            message: 'Success'
          }
        },
        errors: []
      })
    }
  }))
}));

vi.mock('~/services/agentStreaming', () => ({
  AgentStreamingService: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    approveTool: vi.fn(),
    denyTool: vi.fn(),
  })),
}));

vi.mock('../agentContextsStore', () => ({
  useAgentContextsStore: vi.fn(),
}));

vi.mock('../conversationHistory', () => ({
  useConversationHistoryStore: vi.fn(() => ({
    agentDefinitionId: 'def-1',
    fetchConversationHistory: vi.fn(),
  })),
}));

describe('agentRunStore', () => {
    let mockAgentContext: any;
    let mockContextsStore: any;

    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();

        mockAgentContext = {
            config: {
                agentDefinitionId: 'def-1',
                agentDefinitionName: 'Test Agent',
                workspaceId: 'ws-1',
                llmModelIdentifier: 'gpt-4',
                autoExecuteTools: false,
                isLocked: false,
            },
            state: {
                agentId: 'temp-1',
                conversation: {
                    messages: [],
                    agentDefinitionId: 'def-1',
                    updatedAt: new Date().toISOString()
                }
            },
            requirement: 'do something',
            contextFilePaths: [],
            isSending: false,
            isSubscribed: false,
        };

        mockContextsStore = {
            activeInstance: mockAgentContext, // Initial state
            promoteTemporaryId: vi.fn(),
            lockConfig: vi.fn(),
            getInstance: vi.fn((id: string) => {
                if (id === 'perm-agent-id') return mockAgentContext; // mocking return after promotion
                return mockAgentContext; 
            }),
            removeInstance: vi.fn(),
        };

        // @ts-ignore
        useAgentContextsStore.mockReturnValue(mockContextsStore);
    });

    it('sendUserInputAndSubscribe should handle new agent flow', async () => {
        const store = useAgentRunStore();
        
        await store.sendUserInputAndSubscribe();

        // 1. Should add user message to state
        expect(mockAgentContext.state.conversation.messages).toHaveLength(1);
        expect(mockAgentContext.state.conversation.messages[0].text).toBe('do something');
        
        // 2. Should call mutation (implicit via successful execution)
        
        // 3. Should promote temp ID
        expect(mockContextsStore.promoteTemporaryId).toHaveBeenCalledWith('temp-1', 'perm-agent-id');

        // 4. Should lock config after first message
        expect(mockContextsStore.lockConfig).toHaveBeenCalledWith('perm-agent-id');
        
        // 5. Should clear requirement
        expect(mockAgentContext.requirement).toBe('');
        
        // 6. Should connect stream
        // (AgentStreamingService constructor logic is hidden in mock, but we verify method call or side effect)
        expect(AgentStreamingService).toHaveBeenCalled(); 
    });

    it('sendUserInputAndSubscribe should throw if no agent selected', async () => {
        // @ts-ignore
        useAgentContextsStore.mockReturnValue({ activeInstance: null });
        const store = useAgentRunStore();
        
        await expect(store.sendUserInputAndSubscribe()).rejects.toThrowError("No active agent selected");
    });
    
    it('closeAgent should disconnect and remove context', async () => {
        const store = useAgentRunStore();
        const unsubscribeMock = vi.fn();
        mockAgentContext.unsubscribe = unsubscribeMock;
        mockAgentContext.isSubscribed = true;
        
        // @ts-ignore
        mockContextsStore.getInstance = vi.fn(() => mockAgentContext);
        
        await store.closeAgent('agent-1', { terminate: false });
        
        expect(unsubscribeMock).toHaveBeenCalled();
        expect(mockAgentContext.isSubscribed).toBe(false);
        expect(mockContextsStore.removeInstance).toHaveBeenCalledWith('agent-1');
    });
});
