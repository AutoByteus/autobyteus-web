import type { GetAgentMemoryViewQuery, ListAgentMemorySnapshotsQuery } from '~/generated/graphql';

export type MemorySnapshotPage = ListAgentMemorySnapshotsQuery['listAgentMemorySnapshots'];
export type MemorySnapshotSummary = MemorySnapshotPage['entries'][number];

export type AgentMemoryView = GetAgentMemoryViewQuery['getAgentMemoryView'];
export type MemoryMessage = NonNullable<AgentMemoryView['workingContext']>[number];
export type MemoryTraceEvent = NonNullable<AgentMemoryView['rawTraces']>[number];
