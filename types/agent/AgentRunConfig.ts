/**
 * Configuration for a running agent instance.
 * 
 * Each agent instance has its own config that is:
 * - Editable before the first message is sent
 * - Locked (isLocked=true) after the first message
 */
export interface AgentRunConfig {
  /** ID of the agent definition this instance is based on */
  agentDefinitionId: string;
  
  /** Display name of the agent (from definition) */
  agentDefinitionName: string;
  
  /** LLM model identifier (e.g., 'gpt-4-turbo', 'claude-3-sonnet') */
  llmModelIdentifier: string;
  
  /** Workspace ID if a workspace is attached, null otherwise */
  workspaceId: string | null;
  
  /** Whether to auto-execute tool calls without user confirmation */
  autoExecuteTools: boolean;
  
  /** 
   * Whether this config is locked (read-only).
   * Set to true after the first message is sent to the backend.
   */
  isLocked: boolean;
  
  /**
   * Model-specific runtime configuration (e.g., thinking_level for Gemini).
   * Schema is defined by the model's configSchema.
   */
  llmConfig?: Record<string, unknown> | null;
}
