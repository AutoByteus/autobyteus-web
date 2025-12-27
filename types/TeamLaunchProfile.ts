import type { AgentTeamDefinition } from '~/stores/agentTeamDefinitionStore';

/**
 * A generic structure for a group of selectable options.
 */
export interface GroupedOption {
  label: string;
  items: { id: string; name: string }[];
}

/**
 * A reusable structure to define how a workspace should be configured for launch.
 * It can be a new workspace, an existing one, or none at all.
 */
export interface WorkspaceLaunchConfig {
  mode: 'new' | 'existing' | 'none';
  
  // The ID of the workspace if mode is 'existing'.
  existingWorkspaceId?: string;
  
  // The configuration needed to create a new workspace if mode is 'new'.
  newWorkspaceConfig?: {
    root_path: string;
  };
}

/**
 * Defines the specific overrides for a single team member. 
 * Any property defined here will override the team's global default configuration.
 */
export interface TeamMemberConfigOverride {
  memberName: string;
  llmModelIdentifier?: string;
  workspaceConfig?: WorkspaceLaunchConfig;
  autoExecuteTools?: boolean;
  parseToolCalls?: boolean;
}

/**
 * The main data structure for a saved team launch configuration.
 * It stores the global defaults and a list of member-specific overrides.
 */
export interface TeamLaunchProfile {
  id: string;
  name: string;
  createdAt: string;
  teamDefinition: AgentTeamDefinition;

  // Global/Default settings applicable to all members unless specifically overridden.
  globalConfig: {
    llmModelIdentifier: string;
    workspaceConfig: WorkspaceLaunchConfig;
    autoExecuteTools: boolean;
    parseToolCalls: boolean;
    taskNotificationMode: 'AGENT_MANUAL_NOTIFICATION' | 'SYSTEM_EVENT_DRIVEN';
    useXmlToolFormat: boolean;
  };

  // A list of specific overrides for individual team members.
  memberOverrides: TeamMemberConfigOverride[];
}
