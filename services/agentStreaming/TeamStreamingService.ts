/**
 * TeamStreamingService - Facade for agent team WebSocket streaming.
 * 
 * Connects to team endpoint and routes events to appropriate team members
 * based on agent_id in the message payload.
 */

import type { AgentContext } from '~/types/agent/AgentContext';
import type { AgentTeamContext } from '~/types/agent/AgentTeamContext';
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
  handleInterAgentMessage,
  handleSystemTaskNotification,
} from './handlers';

export interface TeamStreamingServiceOptions {
  baseUrl?: string;
  wsClient?: IWebSocketClient;
}

export class TeamStreamingService {
  private wsClient: IWebSocketClient;
  private teamContext: AgentTeamContext | null = null;
  private baseUrl: string;

  constructor(options: TeamStreamingServiceOptions = {}) {
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
   * Connect to a team's WebSocket stream.
   */
  connect(teamId: string, teamContext: AgentTeamContext): void {
    this.teamContext = teamContext;
    
    this.wsClient.on('onMessage', this.handleMessage);
    this.wsClient.on('onConnect', this.handleConnect);
    this.wsClient.on('onDisconnect', this.handleDisconnect);
    this.wsClient.on('onError', this.handleError);

    const url = `${this.baseUrl}/ws/agent-team/${teamId}`;
    this.wsClient.connect(url);
  }

  disconnect(): void {
    this.wsClient.off('onMessage', this.handleMessage);
    this.wsClient.off('onConnect', this.handleConnect);
    this.wsClient.off('onDisconnect', this.handleDisconnect);
    this.wsClient.off('onError', this.handleError);

    this.wsClient.disconnect();
    this.teamContext = null;
  }

  sendMessage(content: string, targetMemberName?: string, contextFilePaths?: string[]): void {
    const message: ClientMessage = {
      type: 'SEND_MESSAGE',
      payload: {
        content,
        context_file_paths: contextFilePaths,
        target_member_name: targetMemberName,
      },
    };
    this.wsClient.send(serializeClientMessage(message));
  }

  approveTool(invocationId: string): void {
    const message: ClientMessage = {
      type: 'APPROVE_TOOL',
      payload: { invocation_id: invocationId },
    };
    this.wsClient.send(serializeClientMessage(message));
  }

  denyTool(invocationId: string): void {
    const message: ClientMessage = {
      type: 'DENY_TOOL',
      payload: { invocation_id: invocationId },
    };
    this.wsClient.send(serializeClientMessage(message));
  }

  stopGeneration(): void {
    const message: ClientMessage = { type: 'STOP_GENERATION' };
    this.wsClient.send(serializeClientMessage(message));
  }

  private handleMessage = (raw: string): void => {
    if (!this.teamContext) return;

    try {
      const message = parseServerMessage(raw);
      this.dispatchMessage(message, this.teamContext);
    } catch (e) {
      console.error('Failed to parse WebSocket message:', e);
    }
  };

  private handleConnect = (): void => {
    console.log('Team WebSocket connected');
  };

  private handleDisconnect = (reason?: string): void => {
    console.log('Team WebSocket disconnected:', reason);
  };

  private handleError = (error: Error): void => {
    console.error('Team WebSocket error:', error);
  };

  /**
   * Route message to the appropriate team member based on agent_id.
   */
  private getMemberContext(message: ServerMessage): AgentContext | null {
    if (!this.teamContext) return null;

    // Extract agent_id from the message payload if present
    // Use type assertion since not all message types have agent_id
    const payload = 'payload' in message ? message.payload as { agent_id?: string } : null;
    const agentId = payload?.agent_id;

    if (agentId) {
      // Find member by checking their agentState.agentId
      for (const [memberName, memberContext] of this.teamContext.members) {
        if (memberContext.state.agentId === agentId || memberName === agentId) {
          return memberContext;
        }
      }
    }

    // Fall back to focused member
    return this.teamContext.members.get(this.teamContext.focusedMemberName) || null;
  }

  private dispatchMessage(message: ServerMessage, teamContext: AgentTeamContext): void {
    const memberContext = this.getMemberContext(message);
    
    if (!memberContext) {
      console.warn('No member context found for message, skipping');
      return;
    }

    memberContext.conversation.updatedAt = new Date().toISOString();

    switch (message.type) {
      case 'SEGMENT_START':
        handleSegmentStart(message.payload, memberContext);
        break;

      case 'SEGMENT_CONTENT':
        handleSegmentContent(message.payload, memberContext);
        break;

      case 'SEGMENT_END':
        handleSegmentEnd(message.payload, memberContext);
        break;

      case 'TOOL_APPROVAL_REQUESTED':
        handleToolApprovalRequested(message.payload, memberContext);
        break;

      case 'TOOL_AUTO_EXECUTING':
        handleToolAutoExecuting(message.payload, memberContext);
        break;

      case 'TOOL_LOG':
        handleToolLog(message.payload, memberContext);
        break;

      case 'AGENT_STATUS':
        handleAgentStatus(message.payload, memberContext);
        break;

      case 'TODO_LIST_UPDATE':
        handleTodoListUpdate(message.payload, memberContext);
        break;

      case 'ERROR':
        handleError(message.payload, memberContext);
        break;

      case 'INTER_AGENT_MESSAGE':
        handleInterAgentMessage(message.payload, memberContext);
        break;

      case 'SYSTEM_TASK_NOTIFICATION':
        handleSystemTaskNotification(message.payload, memberContext);
        break;

      case 'CONNECTED':
        break;

      default:
        console.warn('Unhandled team message type:', (message as any).type);
    }
  }
}
