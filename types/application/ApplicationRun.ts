import type { AgentTeamContext } from '~/types/agent/AgentTeamContext';
import type { AgentTeamDefinition } from '~/stores/agentTeamDefinitionStore';

/**
 * @interface ApplicationLaunchConfig
 * @description Represents the required inputs for launching a new application instance
 * and creating a persistent launch profile for it.
 */
export interface ApplicationLaunchConfig {
  appId: string;
  profileName: string; // Name for the new launch profile
  teamDefinition: AgentTeamDefinition;
  agentLlmConfig: Record<string, string>; // Maps memberName to modelIdentifier
}

/**
 * @interface ApplicationRunContext
 * @description Represents the complete state of a single, running application instance.
 * It wraps the underlying AgentTeamContext, providing an application-specific layer.
 */
export interface ApplicationRunContext {
  instanceId: string;
  appId: string;
  launchProfileId: string; // Link to the profile used for this run
  teamContext: AgentTeamContext;
}
