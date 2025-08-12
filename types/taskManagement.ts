export enum TaskStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  BLOCKED = "blocked",
  FAILED = "failed",
}

export interface Task {
  taskId: string;
  taskName: string;
  assigneeName: string;
  description: string;
  dependencies: string[];
  producedArtifactIds: string[];
}
