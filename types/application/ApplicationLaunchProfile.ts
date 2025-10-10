import type { AgentTeamDefinition } from '~/stores/agentTeamDefinitionStore';

/**
 * @interface ApplicationLaunchProfile
 * @description Represents a saved, reusable configuration for launching an application.
 */
export interface ApplicationLaunchProfile {
  id: string; // uuid
  name: string;
  createdAt: string; // ISO date string
  appId: string;
  // A snapshot of the team definition at the time of profile creation
  teamDefinition: AgentTeamDefinition;
  // The core configuration, mapping agent member names to their chosen LLM identifiers
  agentLlmConfig: Record<string, string>;
}
