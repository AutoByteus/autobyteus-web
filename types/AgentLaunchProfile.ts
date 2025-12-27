import type { AgentDefinition } from '~/stores/agentDefinitionStore';

export interface AgentLaunchProfile {
  id: string;
  workspaceId: string | null;
  agentDefinition: AgentDefinition; 
  name: string;
  createdAt: string;
  workspaceConfig: any;
}
