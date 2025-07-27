export interface AgentRunConfig {
  launchProfileId: string;
  workspaceId: string | null;
  llmModelName: string;
  autoExecuteTools: boolean;
  useXmlToolFormat: boolean;
  parseToolCalls: boolean;
}
