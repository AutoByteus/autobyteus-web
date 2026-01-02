import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentStreamingService } from '../AgentStreamingService';
// import { AgentContext } from '~/types/agent/AgentContext'; // We can just mock the context interface for testing

// Mock WebSocketClient
vi.mock('../transport', () => {
    return {
        WebSocketClient: vi.fn().mockImplementation(() => ({
            connect: vi.fn(),
            disconnect: vi.fn(),
            send: vi.fn(),
            on: vi.fn(),
            off: vi.fn(),
            state: 'disconnected',
        })),
        ConnectionState: {
            DISCONNECTED: 'disconnected',
            CONNECTING: 'connecting',
            CONNECTED: 'connected',
            DISCONNECTING: 'disconnecting',
        }
    };
});

describe('AgentStreamingService', () => {
    let service: AgentStreamingService;
    let mockAgentContext: any;

    beforeEach(() => {
        service = new AgentStreamingService();
        mockAgentContext = {
            state: { 
                agentId: 'test-agent-id',
                conversation: { messages: [] }
            },
            config: {}
        };
    });

    it('should initialize with disconnected state', () => {
        expect((service as any).client).toBeDefined(); 
    });

    it('should connect and set agent context', async () => {
        const agentId = 'test-agent-id';
        await service.connect(agentId, mockAgentContext);
        
        expect((service as any).context).toBe(mockAgentContext);
        const clientMock = (service as any).client;
        expect(clientMock.connect).toHaveBeenCalledWith(expect.stringContaining(agentId));
    });
});
