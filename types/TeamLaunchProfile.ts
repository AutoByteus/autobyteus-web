import type { AgentTeamDefinition } from '~/stores/agentTeamDefinitionStore';
import type { TeamMemberConfigInput } from '~/generated/graphql';

export interface TeamLaunchProfile {
  id: string;
  teamDefinition: AgentTeamDefinition;
  name: string;
  createdAt: string;
  // This stores the exact configuration used for a specific launch.
  teamConfig: {
    globalLlmModelName: string;
    globalWorkspaceId: string | null;
    memberConfigs: TeamMemberConfigInput[];
  }
}
