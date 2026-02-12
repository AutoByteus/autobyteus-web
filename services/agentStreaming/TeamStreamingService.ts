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
  handleToolApproved,
  handleToolDenied,
  handleToolExecutionStarted,
  handleToolExecutionSucceeded,
  handleToolExecutionFailed,
  handleToolLog,
  handleAgentStatus,
  handleAssistantComplete,
  handleTodoListUpdate,
  handleError,
  handleInterAgentMessage,
  handleSystemTaskNotification,
  handleTeamStatus,
  handleTaskPlanEvent,
} from './handlers';

const shouldLogStreaming = (): boolean => {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  if (w.__AUTOBYTEUS_DEBUG_STREAMING__ === true) return true;
  try {
    return w.localStorage?.getItem('autobyteus.debug.streaming') === 'true';
  } catch {
    return false;
  }
};

const summarizeDelta = (delta: string, maxLen = 120): string => {
  if (!delta) return '';
  const clean = delta.replace(/\n/g, '\\n');
  return clean.length > maxLen ? `${clean.slice(0, maxLen)}…` : clean;
};

export interface TeamStreamingServiceOptions {
  wsClient?: IWebSocketClient;
}

export class TeamStreamingService {
  private wsClient: IWebSocketClient;
  private teamContext: AgentTeamContext | null = null;
  private wsEndpoint: string;

  /**
   * Create a TeamStreamingService.
   * 
   * @param wsEndpoint - WebSocket endpoint from runtime config (e.g., 'ws://localhost:8000/ws/agent-team')
   * @param options - Optional configuration for testing
   */
  constructor(wsEndpoint: string, options: TeamStreamingServiceOptions = {}) {
    this.wsClient = options.wsClient || new WebSocketClient();
    this.wsEndpoint = wsEndpoint;
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

    const url = `${this.wsEndpoint}/${teamId}`;
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

  approveTool(invocationId: string, agentName?: string, reason?: string): void {
    const message: ClientMessage = {
      type: 'APPROVE_TOOL',
      payload: { invocation_id: invocationId, agent_name: agentName, reason },
    };
    this.wsClient.send(serializeClientMessage(message));
  }

  denyTool(invocationId: string, agentName?: string, reason?: string): void {
    const message: ClientMessage = {
      type: 'DENY_TOOL',
      payload: { invocation_id: invocationId, agent_name: agentName, reason },
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
      this.logMessage(message);
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

  private logMessage(message: ServerMessage): void {
    if (!shouldLogStreaming()) return;

    switch (message.type) {
      case 'SEGMENT_START': {
        const { id, segment_type, metadata } = message.payload;
        console.log('[stream][team][segment:start]', { id, segment_type, metadata, payload: message.payload });
        break;
      }
      case 'SEGMENT_CONTENT': {
        const { id, delta } = message.payload;
        console.log('[stream][team][segment:content]', {
          id,
          deltaLen: delta?.length ?? 0,
          deltaSample: summarizeDelta(delta || ''),
          payload: message.payload,
        });
        break;
      }
      case 'SEGMENT_END': {
        const { id, metadata } = message.payload;
        console.log('[stream][team][segment:end]', { id, metadata, payload: message.payload });
        break;
      }
      default:
        console.log('[stream][team][message]', { type: message.type, payload: message.payload });
        break;
    }
  }

  /**
   * Route message to the appropriate team member based on agent_id.
   */
  private getMemberContext(message: ServerMessage): AgentContext | null {
    if (!this.teamContext) return null;

    // Extract agent_id from the message payload if present
    // Use type assertion since not all message types have agent_id
    const payload = 'payload' in message ? message.payload as { agent_id?: string; agent_name?: string } : null;
    const agentName = payload?.agent_name;
    const agentId = payload?.agent_id;

    if (agentName) {
      const directMatch = this.teamContext.members.get(agentName);
      if (directMatch) {
        if (agentId && directMatch.state.agentId !== agentId) {
          directMatch.state.agentId = agentId;
        }
        return directMatch;
      }
    }

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

      case 'TOOL_APPROVED':
        handleToolApproved(message.payload, memberContext);
        break;

      case 'TOOL_DENIED':
        handleToolDenied(message.payload, memberContext);
        break;

      case 'TOOL_EXECUTION_STARTED':
        handleToolExecutionStarted(message.payload, memberContext);
        break;

      case 'TOOL_EXECUTION_SUCCEEDED':
        handleToolExecutionSucceeded(message.payload, memberContext);
        break;

      case 'TOOL_EXECUTION_FAILED':
        handleToolExecutionFailed(message.payload, memberContext);
        break;

      case 'TOOL_LOG':
        handleToolLog(message.payload, memberContext);
        break;

      case 'AGENT_STATUS':
        handleAgentStatus(message.payload, memberContext);
        break;

      case 'ASSISTANT_COMPLETE':
        handleAssistantComplete(message.payload, memberContext);
        break;

      case 'TODO_LIST_UPDATE':
        handleTodoListUpdate(message.payload, memberContext);
        break;

      case 'TEAM_STATUS':
        handleTeamStatus(message.payload, teamContext);
        break;

      case 'TASK_PLAN_EVENT':
        handleTaskPlanEvent(message.payload, teamContext);
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
