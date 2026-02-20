# Investigation Notes - personal-team-shared-workspace-tree-layout

## Context
User request: for personal mode UX, agent-team runs should be organized under the workspace node (same top-level structure as single-agent runs) instead of a separate global `Teams` section showing per-member workspace labels. In personal mode, members share the same workspace, so member-level workspace suffixes are redundant and visually noisy.

## Sources Consulted
- `/Users/normy/autobyteus_org/autobyteus-workspace/autobyteus-web/components/workspace/history/WorkspaceAgentRunsTreePanel.vue`
- `/Users/normy/autobyteus_org/autobyteus-workspace/autobyteus-web/components/workspace/history/WorkspaceRunsSection.vue`
- `/Users/normy/autobyteus_org/autobyteus-workspace/autobyteus-web/components/workspace/history/TeamRunsSection.vue`
- `/Users/normy/autobyteus_org/autobyteus-workspace/autobyteus-web/composables/workspace/history/useRunTreeViewState.ts`
- `/Users/normy/autobyteus_org/autobyteus-workspace/autobyteus-web/composables/workspace/history/useRunTreeActions.ts`
- `/Users/normy/autobyteus_org/autobyteus-workspace/autobyteus-web/stores/runTreeStore.ts`
- `/Users/normy/autobyteus_org/autobyteus-workspace/autobyteus-web/graphql/queries/runHistoryQueries.ts`
- `/Users/normy/autobyteus_org/autobyteus-workspace/autobyteus-web/components/workspace/history/__tests__/TeamRunsSection.spec.ts`
- `/Users/normy/autobyteus_org/autobyteus-workspace/autobyteus-web/components/workspace/history/__tests__/WorkspaceAgentRunsTreePanel.spec.ts`
- `/Users/normy/autobyteus_org/autobyteus-workspace/autobyteus-web/tickets/workspace-runs-tree-panel-soc-refactor/proposed-design.md`
- `/Users/normy/autobyteus_org/autobyteus-workspace/autobyteus-web/tickets/team-cross-node-workspace-routing/requirements.md`
- `/Users/normy/autobyteus_org/autobyteus-workspace/autobyteus-server-ts/src/api/graphql/types/agent-team-instance.ts`
- `/Users/normy/autobyteus_org/autobyteus-workspace/autobyteus-server-ts/src/api/graphql/types/team-run-history.ts`
- `/Users/normy/autobyteus_org/autobyteus-workspace/autobyteus-server-ts/src/run-history/services/team-run-history-service.ts`
- Branch comparison evidence:
  - `git show enterprise:components/workspace/history/WorkspaceAgentRunsTreePanel.vue`
  - `git show personal:components/workspace/history/WorkspaceAgentRunsTreePanel.vue`

## Current-State Findings
1. Workspace history tree currently has two top-level sections:
   - workspace-rooted single-agent history via `WorkspaceRunsSection`
   - global team history via `TeamRunsSection`.
2. Team member rows currently display `workspacePathLeafName(member.workspaceRootPath)`, which causes repetitive workspace text for every member in single-workspace personal scenarios.
3. Team run and member data are currently modeled as standalone nodes (`getTeamNodes()` in `runTreeStore`) and not merged into workspace-rooted nodes (`getTreeNodes()`).
4. The current structure was introduced by SoC refactor and enterprise-oriented routing work, where per-member workspace routing is required for mixed-node teams.
5. Backend team manifest supports per-member `workspaceRootPath` and `hostNodeId`; this is needed for enterprise/mixed-node routing but does not require personal UI to show duplicate workspace labels.
6. Branch comparison confirms drift:
   - `personal` branch baseline did not contain the current team-history tree section.
   - detached current code aligns with enterprise-style tree decomposition.

## Constraints
- No backend contract break: GraphQL fields and manifest shape remain unchanged.
- No legacy dual-UI path for personal-only behavior: final UI structure should be one coherent model in this branch.
- Must preserve existing run/team selection behavior and open-flow contracts (`selectTreeRun`, `openTeamMemberRun`).
- Keep team terminate/delete controls available in the new workspace-rooted placement.

## Risks
- Grouping team runs by workspace path requires deterministic `teamWorkspaceRootPath` derivation when member bindings are incomplete or mixed.
- If a team has no resolvable workspace root, it can disappear from a strict workspace-only tree unless a fallback bucket is defined.
- Existing tests are heavily coupled to `TeamRunsSection`; refactor requires synchronized test updates to avoid false regressions.

## Open Unknowns
1. Fallback behavior when a team run has mixed member workspace roots (enterprise-like shape) in this branch:
   - force first-member workspace,
   - reject and hide,
   - or place under an explicit `unassigned` workspace group.
2. Whether team-level row should be shown inline among agent groups under workspace, or in a dedicated `Teams` subsection inside each workspace node.

## Resolution Direction For Unknowns
- Use deterministic grouping with explicit fallback:
  - derive team workspace root from manifest member bindings,
  - if none can be resolved, place under synthetic workspace node `unassigned-team-workspace` (display label `Unassigned Team Workspace`) to avoid hidden history.
- Use a dedicated `Teams` subsection inside each workspace node to preserve scanability and action affordances without returning to global Teams root.

## Implications For Requirements/Design
- This is a medium-scope frontend redesign of run-tree projection and rendering boundaries:
  - store projection model change,
  - section-component API changes,
  - view-state changes (remove global teams expansion state),
  - regression test rewrites.
- Backend changes are not required for this UX change.
- Existing enterprise-oriented per-member workspace metadata remains in data model but should not be rendered redundantly in personal workspace tree rows.

---

## Re-Investigation Checkpoint - 2026-02-20 (Team Member Continuation Context Loss)

### New Field Evidence
- User reproduced a post-restore continuation failure:
  - historical team member messages render in UI,
  - but follow-up continuation message receives "no previous context" response.
- Repro path:
  1. Run a team member and produce prior conversation/tool activity.
  2. Terminate team runtime.
  3. Re-open team member from run history and continue conversation.
  4. Runtime responds as if previous context was not restored.

### Additional Sources Consulted
- `/Users/normy/autobyteus_org/autobyteus-workspace/autobyteus-web/stores/agentTeamRunStore.ts`
- `/Users/normy/autobyteus_org/autobyteus-workspace/autobyteus-server-ts/src/api/graphql/types/agent-team-instance.ts`
- `/Users/normy/autobyteus_org/autobyteus-workspace/autobyteus-server-ts/src/run-history/services/team-run-continuation-service.ts`
- `/Users/normy/autobyteus_org/autobyteus-workspace/autobyteus-server-ts/src/agent-team-execution/services/agent-team-instance-manager.ts`
- `/Users/normy/autobyteus_org/autobyteus-workspace/autobyteus-ts/src/agent-team/context/team-manager.ts`
- `/Users/normy/autobyteus_org/autobyteus-workspace/autobyteus-server-ts/tests/unit/run-history/team-run-continuation-service.test.ts`
- `/Users/normy/autobyteus_org/autobyteus-workspace/autobyteus-server-ts/tests/integration/run-history/team-run-continuation-lifecycle.integration.test.ts`

### New Findings
1. Frontend path is correct: historical team continuation sends `sendMessageToTeam` with existing `teamId` and focused `targetMemberName`.
2. Backend continuation path is used for this branch:
   - `AgentTeamInstanceResolver.sendMessageToTeam(...)` -> `TeamRunContinuationService.continueTeamRun(...)`.
3. `TeamRunContinuationService.restoreTeamRuntime(...)` reconstructs member configs with `memberAgentId`, but does not pass `memoryDir`.
4. `AgentTeamInstanceManager.buildAgentConfigFromDefinition(...)` sets `initialCustomData.teamRestore` only when `memoryDir` is present.
5. Without `teamRestore`, `autobyteus-ts` `TeamManager.ensureNodeIsReady(...)` does not call `restoreAgent(...)`; it falls back to `createAgentWithId(...)`, which starts runtime with deterministic ID but without snapshot restore bootstrap.
6. Result: UI can display old projection/history from disk, while live runtime context is fresh and loses prior turn state.
7. Existing tests missed this because they assert restore lifecycle and deterministic IDs, but do not assert restore metadata propagation (`memoryDir` -> `teamRestore`) for team member continuation.

### Updated Risk Assessment
- High user-facing correctness risk:
  - history appears loaded, but continuation behavior contradicts visible history.
- Regression risk:
  - fixing continuation restore metadata could affect create/restore path branching in team member lazy initialization.

### Proposed Fix Direction
- Ensure continuation restore member configs include `memoryDir` so runtime emits `teamRestore` metadata and member nodes are created via `restoreAgent(...)`.
- Add explicit unit/integration coverage for restore metadata propagation in team continuation flow.

---

## Re-Investigation Checkpoint - 2026-02-20 (Controller-Spy E2E Coverage Gap)

### Trigger
- User requested deeper confidence because E2E coverage still used heavy controller/team-manager spies that could hide real lifecycle regressions.

### Additional Sources Consulted
- `/Users/normy/autobyteus_org/autobyteus-workspace/autobyteus-server-ts/tests/e2e/run-history/team-run-restore-lifecycle-graphql.e2e.test.ts`
- `/Users/normy/autobyteus_org/autobyteus-workspace/autobyteus-server-ts/tests/e2e/run-history/team-member-projection-contract.e2e.test.ts`
- `/Users/normy/autobyteus_org/autobyteus-workspace/autobyteus-server-ts/src/api/graphql/types/agent-definition.ts`
- `/Users/normy/autobyteus_org/autobyteus-workspace/autobyteus-server-ts/src/api/graphql/types/agent-team-definition.ts`

### Findings
1. Prior E2E variants mocked `AgentTeamInstanceManager.createTeamInstanceWithId`, `terminateTeamInstance`, and `getTeamInstance`.
2. Those mocks bypassed real definition lookup, config hydration, and runtime lifecycle wiring.
3. This allowed endpoint tests to pass even when real lifecycle behavior was not exercised end-to-end.
4. LLM execution can still be safely seam-controlled for determinism, but team-manager lifecycle should stay real in these coverage paths.

### Investigation Outcome
- Refactor E2E setup to create real prompt/agent/team definitions via GraphQL and run actual team manager lifecycle.
- Keep deterministic seams only where necessary:
  - `LLMFactory.createLLM` mocked with dummy runtime-safe LLM instance,
  - ingress dispatch controlled to avoid nondeterministic external model calls.
