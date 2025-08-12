import type { TeamLaunchProfile } from '~/types/TeamLaunchProfile';
import type { AgentContext } from './AgentContext';
import type { Task, TaskStatus } from '~/types/taskManagement';

/**
 * @interface AgentTeamContext
 * @description Represents the complete state of a single, running agent team instance.
 * It encapsulates the launch profile, the state of all member agents, the overall
 * team status, and the current UI focus.
 */
export interface AgentTeamContext {
  teamId: string;
  launchProfile: TeamLaunchProfile;
  members: Map<string, AgentContext>;
  focusedMemberName: string;
  currentPhase: string;
  isSubscribed: boolean;
  unsubscribe?: () => void;
  taskPlan: Task[] | null;
  taskStatuses: Record<string, TaskStatus> | null;
}
