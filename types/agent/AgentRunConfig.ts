export interface AgentRunConfig {
  launchProfileId: string;
  workspaceId: string | null;
  llmModelName: string;
  autoExecuteTools: boolean;
  parseToolCalls: boolean;
}
