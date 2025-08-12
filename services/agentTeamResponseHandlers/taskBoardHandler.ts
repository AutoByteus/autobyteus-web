// file: autobyteus-web/services/agentTeamResponseHandlers/taskBoardHandler.ts
import type { GraphQLTaskPlanPublishedEvent, GraphQLTaskStatusUpdatedEvent } from '~/generated/graphql';
import type { AgentTeamContext } from '~/types/agent/AgentTeamContext';
import type { Task } from '~/types/taskManagement';
import { TaskStatus } from '~/types/taskManagement';

function mapGqlTaskToLocal(gqlTask: any): Task {
  return {
    taskId: gqlTask.taskId,
    taskName: gqlTask.taskName,
    assigneeName: gqlTask.assigneeName,
    description: gqlTask.description,
    dependencies: gqlTask.dependencies,
    fileDeliverables: gqlTask.fileDeliverables?.map((d: any) => ({ ...d })) || [],
  };
}

export function handleTaskPlanPublished(
  data: GraphQLTaskPlanPublishedEvent,
  teamContext: AgentTeamContext
): void {
  console.log(`Task plan published for team ${teamContext.teamId}`);
  if (data.plan && data.plan.tasks) {
    teamContext.taskPlan = data.plan.tasks.map(mapGqlTaskToLocal);
    const newStatuses: Record<string, TaskStatus> = {};
    for (const task of data.plan.tasks) {
      newStatuses[task.taskId] = TaskStatus.NOT_STARTED;
    }
    teamContext.taskStatuses = newStatuses;
  }
}

export function handleTaskStatusUpdated(
  data: GraphQLTaskStatusUpdatedEvent,
  teamContext: AgentTeamContext
): void {
  if (!teamContext.taskStatuses) {
    teamContext.taskStatuses = {};
  }
  console.log(`Task status updated for task ${data.taskId} to ${data.newStatus}`);
  // The GQL enum is UPPER_SNAKE_CASE, our local enum is snake_case.
  teamContext.taskStatuses[data.taskId] = data.newStatus.toLowerCase() as TaskStatus;

  // Update deliverables for the specific task
  if (data.deliverables && teamContext.taskPlan) {
    const taskIndex = teamContext.taskPlan.findIndex(t => t.taskId === data.taskId);
    if (taskIndex !== -1) {
      teamContext.taskPlan[taskIndex].fileDeliverables = data.deliverables.map((d: any) => ({ ...d }));
      console.log(`Updated deliverables for task ${data.taskId}`);
    }
  }
}
