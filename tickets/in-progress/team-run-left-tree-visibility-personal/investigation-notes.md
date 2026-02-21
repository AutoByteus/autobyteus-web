# Investigation Notes

## Stage

- Understanding Pass: `Completed`
- Last Updated: `2026-02-20`

## Sources Consulted

- `/Users/normy/autobyteus_org/autobyteus-worktrees/personal/autobyteus-web/components/AppLeftPanel.vue`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/personal/autobyteus-web/components/workspace/history/WorkspaceAgentRunsTreePanel.vue`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/personal/autobyteus-web/stores/runHistoryStore.ts`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/personal/autobyteus-web/stores/agentTeamContextsStore.ts`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/personal/autobyteus-web/stores/agentTeamRunStore.ts`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/personal/autobyteus-web/components/workspace/history/__tests__/WorkspaceAgentRunsTreePanel.spec.ts`
- `enterprise:/Users/normy/autobyteus_org/autobyteus-worktrees/personal/autobyteus-web/components/workspace/history/WorkspaceAgentRunsTreePanel.vue`
- `enterprise:/Users/normy/autobyteus_org/autobyteus-worktrees/personal/autobyteus-web/stores/runTreeStore.ts`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/personal/autobyteus-server-ts/src/api/graphql/types/run-history.ts`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/personal/autobyteus-server-ts/src/api/graphql/types/agent-team-instance.ts`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/personal/autobyteus-server-ts/tests/integration/agent-team-execution/agent-team-instance-manager.integration.test.ts`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/personal/autobyteus-server-ts/tests/e2e/run-history/run-history-graphql.e2e.test.ts`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/personal/autobyteus-web/tickets/in-progress/team-run-left-tree-visibility-personal/future-state-runtime-call-stack.md`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/personal/autobyteus-web/tickets/in-progress/team-run-left-tree-visibility-personal/future-state-runtime-call-stack-review.md`
- `enterprise:/Users/normy/autobyteus_org/autobyteus-workspace/autobyteus-server-ts/src/api/graphql/types/agent-team-instance.ts`
- `enterprise:/Users/normy/autobyteus_org/autobyteus-workspace/autobyteus-server-ts/src/run-history/services/team-run-continuation-service.ts`
- `enterprise:/Users/normy/autobyteus_org/autobyteus-worktrees/personal/autobyteus-server-ts/src/api/graphql/types/team-run-history.ts`

## Key Findings

1. Repro behavior is valid
- After `Run Team`, team context exists and workspace/team view opens.
- Left panel workspace tree does not show any team row.

2. Personal frontend root cause (primary)
- Left panel uses `WorkspaceAgentRunsTreePanel`.
- `WorkspaceAgentRunsTreePanel` consumes `runHistoryStore.getTreeNodes()`.
- `runHistoryStore.getTreeNodes()` projects only agent run rows (`workspace -> agents -> runs`); it does not include team contexts.
- Result: team exists in memory (`agentTeamContextsStore`) but is never rendered in the left workspace tree.

3. Personal backend capability gap (secondary)
- Personal server run-history GraphQL exposes agent-run history only (`listRunHistory`, `getRunResumeConfig`, etc.).
- No team-run history GraphQL in personal (`listTeamRunHistory`, `getTeamRunResumeConfig`, `deleteTeamRunHistory` absent).
- Therefore persisted/historical team rows cannot be sourced from backend in personal branch.

4. Enterprise comparison
- Enterprise frontend uses `runTreeStore` + `WorkspaceAgentRunsTreePanel` with both workspace nodes and team nodes (`getTreeNodes()` + `getTeamNodes()`).
- Enterprise backend has dedicated team-run history GraphQL resolver/types.
- So enterprise already solved this with both frontend and backend support.

5. Scope decision for personal
- Immediate UX requirement (team should appear under workspace right after run) can be solved on frontend by projecting live team contexts by workspace root path.
- Full historical parity with enterprise requires backend team-run history APIs and storage model.

6. Backend regression check for this bug path
- Personal backend still exposes team lifecycle/message mutations through `AgentTeamInstanceResolver` (`sendMessageToTeam`, `createAgentTeamInstance`, `terminateAgentTeamInstance`).
- Personal backend tests run in this pass:
  - `pnpm test tests/integration/agent-team-execution/agent-team-instance-manager.integration.test.ts` -> passed.
  - `pnpm test tests/e2e/run-history/run-history-graphql.e2e.test.ts` -> passed.
- These results do not indicate a backend regression specifically causing "team does not appear in left tree after Run".

7. Deep review gate result
- Built future-state call stacks for `UC-001..UC-007` across frontend and backend.
- Round-1 deep review found requirement gaps (persisted team-member auto-open behavior, canonical team workspace grouping, delete policy clarity), then required write-backs were applied to requirements/design/call-stack (`v2`).
- Rounds 2 and 3 were clean; review gate reached `Go Confirmed` with two consecutive clean rounds.

8. Additional deep review round + offline continuation expectation
- User added explicit requirement: persisted/offline team member selection must load history and allow continued member-targeted messaging.
- Enterprise reference confirms this through continuation flow in `sendMessageToTeam` (`teamRunContinuationService.continueTeamRun(...)`).
- Design and call-stack were updated to include this as `UC-008` and reviewed in round 4 (clean pass).

## Conclusion

- This issue is **not frontend-only in absolute terms**:
  - Immediate missing-left-row symptom: frontend projection issue.
  - Historical team-run persistence/listing parity: backend also missing in personal.

- For your stated personal constraint (single shared workspace per team run), frontend live projection is sufficient to satisfy "appear on left under workspace after Run".
