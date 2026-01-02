/**
 * AgentStreamingService - Facade for single agent WebSocket streaming.
 * 
 * Layer 4 of the architecture - wires all layers together and provides
 * a simple API for the store layer to use.
 */

import type { AgentContext } from '~/types/agent/AgentContext';
import { WebSocketClient, ConnectionState, type IWebSocketClient } from './transport';
import { parseServerMessage, serializeClientMessage, type ServerMessage, type ClientMessage } from './protocol';
import {
  handleSegmentStart,
  handleSegmentContent,
  handleSegmentEnd,
  handleToolApprovalRequested,
  handleToolAutoExecuting,
  handleToolLog,
  handleAgentStatus,
  handleTodoListUpdate,
  handleError,
} from './handlers';

export interface AgentStreamingServiceOptions {
  /** Base URL for WebSocket connections (default: uses current host) */
  baseUrl?: string;
  /** Custom WebSocket client for testing */
  wsClient?: IWebSocketClient;
}

export class AgentStreamingService {
  private wsClient: IWebSocketClient;
  private context: AgentContext | null = null;
  private baseUrl: string;

  constructor(options: AgentStreamingServiceOptions = {}) {
    this.wsClient = options.wsClient || new WebSocketClient();
    this.baseUrl = options.baseUrl || this.detectBaseUrl();
  }

  private detectBaseUrl(): string {
    if (typeof window === 'undefined') {
      return 'ws://localhost:8000';
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }

  get connectionState(): ConnectionState {
    return this.wsClient.state;
  }

  /**
   * Connect to an agent's WebSocket stream.
   */
  connect(agentId: string, context: AgentContext): void {
    this.context = context;
    
    this.wsClient.on('onMessage', this.handleMessage);
    this.wsClient.on('onConnect', this.handleConnect);
    this.wsClient.on('onDisconnect', this.handleDisconnect);
    this.wsClient.on('onError', this.handleError);

    const url = `${this.baseUrl}/ws/agent/${agentId}`;
    this.wsClient.connect(url);
  }

  /**
   * Disconnect from the WebSocket stream.
   */
  disconnect(): void {
    this.wsClient.off('onMessage', this.handleMessage);
    this.wsClient.off('onConnect', this.handleConnect);
    this.wsClient.off('onDisconnect', this.handleDisconnect);
    this.wsClient.off('onError', this.handleError);

    this.wsClient.disconnect();
    this.context = null;
  }

  /**
   * Send a user message to the agent.
   */
  sendMessage(content: string, contextFilePaths?: string[], imageUrls?: string[]): void {
    const message: ClientMessage = {
      type: 'SEND_MESSAGE',
      payload: {
        content,
        context_file_paths: contextFilePaths,
        image_urls: imageUrls,
      },
    };
    this.wsClient.send(serializeClientMessage(message));
  }

  /**
   * Approve a tool invocation.
   */
  approveTool(invocationId: string): void {
    const message: ClientMessage = {
      type: 'APPROVE_TOOL',
      payload: { invocation_id: invocationId },
    };
    this.wsClient.send(serializeClientMessage(message));
  }

  /**
   * Deny a tool invocation.
   */
  denyTool(invocationId: string): void {
    const message: ClientMessage = {
      type: 'DENY_TOOL',
      payload: { invocation_id: invocationId },
    };
    this.wsClient.send(serializeClientMessage(message));
  }

  /**
   * Stop the current generation.
   */
  stopGeneration(): void {
    const message: ClientMessage = {
      type: 'STOP_GENERATION',
    };
    this.wsClient.send(serializeClientMessage(message));
  }

  // ============================================================================
  // Private Event Handlers
  // ============================================================================

  private handleMessage = (raw: string): void => {
    if (!this.context) return;

    try {
      const message = parseServerMessage(raw);
      this.dispatchMessage(message, this.context);
    } catch (e) {
      console.error('Failed to parse WebSocket message:', e);
    }
  };

  private handleConnect = (): void => {
    console.log('Agent WebSocket connected');
  };

  private handleDisconnect = (reason?: string): void => {
    console.log('Agent WebSocket disconnected:', reason);
  };

  private handleError = (error: Error): void => {
    console.error('Agent WebSocket error:', error);
  };

  /**
   * Dispatch a parsed message to the appropriate handler.
   */
  private dispatchMessage(message: ServerMessage, context: AgentContext): void {
    // Update timestamp
    context.conversation.updatedAt = new Date().toISOString();

    switch (message.type) {
      case 'SEGMENT_START':
        handleSegmentStart(message.payload, context);
        break;

      case 'SEGMENT_CONTENT':
        handleSegmentContent(message.payload, context);
        break;

      case 'SEGMENT_END':
        handleSegmentEnd(message.payload, context);
        break;

      case 'TOOL_APPROVAL_REQUESTED':
        handleToolApprovalRequested(message.payload, context);
        break;

      case 'TOOL_AUTO_EXECUTING':
        handleToolAutoExecuting(message.payload, context);
        break;

      case 'TOOL_LOG':
        handleToolLog(message.payload, context);
        break;

      case 'AGENT_STATUS':
        handleAgentStatus(message.payload, context);
        break;

      case 'TODO_LIST_UPDATE':
        handleTodoListUpdate(message.payload, context);
        break;

      case 'ERROR':
        handleError(message.payload, context);
        break;

      case 'CONNECTED':
        // Connection confirmed - nothing to do
        break;

      default:
        console.warn('Unhandled message type:', (message as any).type);
    }
  }
}
