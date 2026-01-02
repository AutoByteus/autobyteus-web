/**
 * Protocol layer - Message type definitions matching backend WebSocket protocol.
 * 
 * These types mirror the backend protocol defined in:
 * autobyteus-server/docs/design/agent_websocket_streaming_protocol.md
 */

// ============================================================================
// Server → Client Message Types
// ============================================================================

export type ServerMessageType =
  | 'CONNECTED'
  | 'SEGMENT_START'
  | 'SEGMENT_CONTENT'
  | 'SEGMENT_END'
  | 'AGENT_STATUS'
  | 'TOOL_APPROVAL_REQUESTED'
  | 'TOOL_AUTO_EXECUTING'
  | 'TOOL_LOG'
  | 'ASSISTANT_CHUNK'
  | 'ASSISTANT_COMPLETE'
  | 'TODO_LIST_UPDATE'
  | 'INTER_AGENT_MESSAGE'
  | 'SYSTEM_TASK_NOTIFICATION'
  | 'ERROR';

export type SegmentType = 
  | 'text' 
  | 'tool_call' 
  | 'file' 
  | 'bash' 
  | 'iframe' 
  | 'reasoning';

// --- Payload Types ---

export interface ConnectedPayload {
  agent_id?: string;
  team_id?: string;
  session_id: string;
}

export interface SegmentStartPayload {
  id: string;
  segment_type: SegmentType;
  agent_id?: string;
  metadata?: Record<string, any>;
}

export interface SegmentContentPayload {
  id: string;
  delta: string;
  agent_id?: string;
}

export interface SegmentEndPayload {
  id: string;
  agent_id?: string;
  metadata?: Record<string, any>;
}

export interface AgentStatusPayload {
  new_status: string;
  old_status?: string | null;
  agent_id?: string;
  trigger?: string | null;
  tool_name?: string | null;
  error_message?: string | null;
  error_details?: string | null;
}

export interface ToolApprovalRequestedPayload {
  invocation_id: string;
  tool_name: string;
  arguments: Record<string, any>;
}

export interface ToolAutoExecutingPayload {
  invocation_id: string;
  tool_name: string;
  arguments: Record<string, any>;
}

export interface ToolLogPayload {
  log_entry: string;
  tool_invocation_id: string;
  tool_name: string;
}

export interface TodoItem {
  todo_id: string;
  description: string;
  status: string;
}

export interface TodoListUpdatePayload {
  todos: TodoItem[];
}

export interface InterAgentMessagePayload {
  sender_agent_id: string;
  recipient_role_name: string;
  content: string;
  message_type: string;
}

export interface SystemTaskNotificationPayload {
  sender_id: string;
  content: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
}

// --- Server Message Union ---

export type ServerMessage =
  | { type: 'CONNECTED'; payload: ConnectedPayload }
  | { type: 'SEGMENT_START'; payload: SegmentStartPayload }
  | { type: 'SEGMENT_CONTENT'; payload: SegmentContentPayload }
  | { type: 'SEGMENT_END'; payload: SegmentEndPayload }
  | { type: 'AGENT_STATUS'; payload: AgentStatusPayload }
  | { type: 'TOOL_APPROVAL_REQUESTED'; payload: ToolApprovalRequestedPayload }
  | { type: 'TOOL_AUTO_EXECUTING'; payload: ToolAutoExecutingPayload }
  | { type: 'TOOL_LOG'; payload: ToolLogPayload }
  | { type: 'TODO_LIST_UPDATE'; payload: TodoListUpdatePayload }
  | { type: 'INTER_AGENT_MESSAGE'; payload: InterAgentMessagePayload }
  | { type: 'SYSTEM_TASK_NOTIFICATION'; payload: SystemTaskNotificationPayload }
  | { type: 'ERROR'; payload: ErrorPayload };

// ============================================================================
// Client → Server Message Types
// ============================================================================

export type ClientMessageType =
  | 'SEND_MESSAGE'
  | 'STOP_GENERATION'
  | 'APPROVE_TOOL'
  | 'DENY_TOOL';

export interface SendMessagePayload {
  content: string;
  context_file_paths?: string[];
  image_urls?: string[];
  target_member_name?: string;
}

export interface ToolActionPayload {
  invocation_id: string;
}

export type ClientMessage =
  | { type: 'SEND_MESSAGE'; payload: SendMessagePayload }
  | { type: 'STOP_GENERATION' }
  | { type: 'APPROVE_TOOL'; payload: ToolActionPayload }
  | { type: 'DENY_TOOL'; payload: ToolActionPayload };
