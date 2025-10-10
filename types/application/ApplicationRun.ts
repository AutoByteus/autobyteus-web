import type { AgentTeamContext } from '~/types/agent/AgentTeamContext';
import type { AgentTeamDefinition } from '~/stores/agentTeamDefinitionStore';

/**
 * @interface ApplicationLaunchConfig
 * @description Represents the required inputs for launching a new application instance.
 * It is a transient object, not meant to be persisted.
 */
export interface ApplicationLaunchConfig {
  appId: string;
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
  teamContext: AgentTeamContext;
}
