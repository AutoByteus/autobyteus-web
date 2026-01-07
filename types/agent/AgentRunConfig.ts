export interface AgentRunConfig {
  launchProfileId: string;
  workspaceId: string | null;
  llmModelIdentifier: string;
  autoExecuteTools: boolean;


}
