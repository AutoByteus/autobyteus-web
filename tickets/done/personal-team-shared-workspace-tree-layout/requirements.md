# Requirements - personal-team-shared-workspace-tree-layout

## Status
Refined

## Goal / Problem Statement
The workspace history tree currently shows team runs in a separate global `Teams` section and repeats workspace labels at member-row level. For personal mode UX, team runs should be organized under the workspace itself because members share the same workspace.

## Requirement Set
- `R-001`: Workspace tree information architecture must be workspace-first for both single-agent and team runs.
- `R-002`: Team rows must be rendered under a workspace-resolved grouping and remain expandable to member rows.
- `R-003`: Member selection/open behavior must be unchanged from existing team member run-open flow.
- `R-004`: Team control actions (terminate/delete history) must remain accessible from workspace-rooted team rows.
- `R-005`: Member-row workspace suffix display must be removed in this personal workspace tree variant.
- `R-006`: Team rows with unresolved workspace path must be grouped under a deterministic fallback workspace bucket.
- `R-007`: Existing single-agent workspace tree behavior must remain intact.
- `R-008`: Regression tests must validate workspace-rooted team placement and unchanged interaction contracts.
- `R-009`: Team member continuation after runtime restore must preserve prior member context (working memory/snapshot), not only UI-visible history projection.
- `R-010`: Team continuation tests must assert restore metadata propagation required for runtime snapshot restore (not only deterministic member IDs).
- `R-011`: Run-history team continuation E2E coverage must exercise real team lifecycle creation/termination/restore paths without spying team-manager lifecycle methods.

## Scope Triage
- Size: `Medium`
- Rationale: cross-component UI information architecture update plus store projection changes and regression-test updates.
- Workflow depth: `Medium` (investigation -> requirements -> proposed design -> future-state runtime call stack -> review -> implementation plan/progress).

## In-Scope Use Cases
1. `UC-001`: User sees single-agent runs and team runs under the same workspace root in left tree.
2. `UC-002`: User expands a team node under workspace and selects any member to open that member history.
3. `UC-003`: User runs terminate/delete actions for workspace-rooted team rows without behavior regression.
4. `UC-004`: User does not see redundant member workspace suffix in personal shared-workspace teams.
5. `UC-005`: Team runs without resolvable workspace path remain visible via deterministic fallback workspace bucket.
6. `UC-006`: User re-opens a terminated team member from history and continues; agent uses prior context instead of replying as a fresh session.

## Acceptance Criteria
1. (`R-001`, `R-002`, `UC-001`) Team runs are rendered inside workspace tree structure rather than global top-level `Teams` section.
2. (`R-002`, `R-003`, `UC-002`) Team rows remain expandable to member rows; member selection continues to call existing open-flow behavior (`selectTreeRun` -> `openTeamMemberRun`).
3. (`R-004`, `UC-003`) Team terminate/delete actions remain available and functional from the new placement.
4. (`R-005`, `UC-004`) Member rows in workspace-rooted team display do not render per-member workspace leaf suffix.
5. (`R-006`, `UC-005`) No team history row becomes unreachable due to missing workspace path; fallback grouping is deterministic with stable workspace key/label.
6. (`R-007`, `UC-001`) Existing single-agent workspace history behavior remains unchanged.
7. (`R-008`) Unit tests cover workspace-rooted team rendering, member selection, and team action events.
8. (`R-009`, `R-010`, `UC-006`) Team continuation path restores member runtime context by passing restore metadata into team member runtime creation; tests fail if continuation reconstructs member with only deterministic ID and no restore bootstrap metadata.
9. (`R-011`) Team restore/member projection E2E tests create real prompt/agent/team definitions and use actual team manager lifecycle behavior, avoiding `createTeamInstanceWithId`/`getTeamInstance`/`terminateTeamInstance` spies.

## Constraints / Dependencies
- Keep existing GraphQL API contracts unchanged (`listTeamRunHistory`, `getTeamRunResumeConfig`, `getTeamMemberRunProjection`).
- Do not reintroduce enterprise-specific global team root in this personal branch UX.
- Preserve current selection and run-open contracts in `runTreeStore` and `useRunTreeActions`.
- No backward-compatibility dual rendering path (`global Teams` + `workspace Teams`) may remain after implementation.
- Team continuation behavior must remain valid for file persistence provider and not require Prisma-specific runtime assumptions.

## Assumptions
- Personal-mode teams are typically single-workspace teams; per-member workspace labels are redundant for this mode.
- Team workspace grouping can be inferred from manifest member bindings already returned in team history payload.
- For grouping, first valid normalized member workspace root can be used as team workspace root in personal mode.
- Restored team member runtime must bootstrap from persisted memory/snapshot path to preserve continuation context.

## Open Questions / Risks
- Fallback label choice must be stable (`Unassigned Team Workspace`) to avoid test fragility and user confusion.
- Existing tests that assert global `Teams` section will require coordinated rewrite.
- Mixed-node team history imported from enterprise-like payloads may still exist; grouping strategy must not hide those rows.
- Continuation tests that validate only ID reuse can produce false confidence; restore-bootstrap assertions are required.
- Controller-spy-heavy E2E tests can hide lifecycle integration gaps and must be replaced by real runtime setup where feasible.
