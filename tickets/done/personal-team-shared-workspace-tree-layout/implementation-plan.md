# Implementation Plan

## Scope Classification
- Classification: `Medium`
- Reasoning: IA shift in workspace tree requires projection-model refactor, view/component rewiring, state key updates, and multi-file regression test updates.
- Workflow Depth:
  - `Medium` -> proposed design doc -> future-state runtime call stack -> future-state runtime call stack review (iterative deep rounds until `Go Confirmed`) -> implementation plan -> progress tracking.

## Upstream Artifacts (Required)
- Investigation notes: `tickets/in-progress/personal-team-shared-workspace-tree-layout/investigation-notes.md`
- Requirements: `tickets/in-progress/personal-team-shared-workspace-tree-layout/requirements.md`
  - Current Status: `Refined`
- Runtime call stacks: `tickets/in-progress/personal-team-shared-workspace-tree-layout/future-state-runtime-call-stack.md`
- Runtime review: `tickets/in-progress/personal-team-shared-workspace-tree-layout/future-state-runtime-call-stack-review.md`
- Proposed design: `tickets/in-progress/personal-team-shared-workspace-tree-layout/proposed-design.md`

## Plan Maturity
- Current Status: `Ready For Implementation`
- Notes: Runtime review gate reached `Go Confirmed` with two clean deep-review rounds.

## Preconditions (Must Be True Before Finalizing This Plan)
- `requirements.md` is at least `Design-ready`: Yes
- Runtime call stack review artifact exists and is current: Yes
- All in-scope use cases reviewed: Yes
- No unresolved blocking findings: Yes
- Runtime review has `Go Confirmed` with two consecutive clean deep-review rounds: Yes

## Runtime Call Stack Review Gate Summary (Required)
| Round | Review Result | Findings Requiring Write-Back | Write-Back Completed | Round State (`Reset`/`Candidate Go`/`Go Confirmed`) | Clean Streak After Round |
| --- | --- | --- | --- | --- | --- |
| 1 | Pass | No | N/A | Candidate Go | 1 |
| 2 | Pass | No | N/A | Go Confirmed | 2 |

## Go / No-Go Decision
- Decision: `Go`
- Evidence:
  - Final review round: `Round 2`
  - Clean streak at final round: `2`
  - Final review gate line (`Implementation can start`): `Yes`

## Principles
- Bottom-up: update store projection and typed node model first, then view/state wiring, then tests.
- Test-driven where practical: update/add targeted specs per changed boundary.
- Mandatory modernization rule: no backward-compatibility shims or dual global+workspace team paths.
- Update progress after each meaningful change.

## Dependency And Sequencing Map
| Order | File/Module | Depends On | Why This Order |
| --- | --- | --- | --- |
| 1 | `stores/runTreeStore.ts` | N/A | Unified workspace-rooted team projection is foundation for UI rendering. |
| 2 | `components/workspace/history/WorkspaceRunsSection.vue` | 1 | Rendering contract depends on new workspace team subtree shape. |
| 3 | `components/workspace/history/WorkspaceAgentRunsTreePanel.vue` | 2 | Remove global `TeamRunsSection` wiring after section owns team subtree. |
| 4 | `composables/workspace/history/useRunTreeViewState.ts` | 2,3 | Remove obsolete team-section expansion state and align keys. |
| 5 | `components/workspace/history/TeamRunsSection.vue` | 2,3 | Decommission obsolete component once no imports remain. |
| 6 | Test files | 1-5 | Assertions must match final contracts and cleanup. |

## Requirement And Design Traceability
| Requirement | Design Section | Use Case / Call Stack | Planned Task ID(s) | Verification |
| --- | --- | --- | --- | --- |
| R-001,R-002,R-007 | Target State, C-001,C-002,C-004 | UC-001 | T-001,T-002,T-003 | Unit |
| R-003 | UC-002 stack + C-001,C-002 | UC-002 | T-001,T-002,T-006 | Unit |
| R-004 | C-002,C-004 | UC-003 | T-002,T-003,T-006 | Unit |
| R-005 | C-002,C-007 | UC-004 | T-002,T-007 | Unit |
| R-006 | C-001 | UC-005 | T-001,T-006 | Unit |
| R-008 | C-006,C-007,C-008 | UC-001..UC-005 | T-006,T-007,T-008 | Unit |

## Design Delta Traceability (Required For `Medium/Large`)
| Change ID (from proposed design doc) | Change Type | Planned Task ID(s) | Includes Remove/Rename Work | Verification |
| --- | --- | --- | --- | --- |
| C-001 | Modify | T-001 | No | `stores/__tests__/runTreeStore.spec.ts` |
| C-002 | Modify | T-002 | No | `components/workspace/history/__tests__/WorkspaceRunsSection.spec.ts` |
| C-003 | Remove | T-005 | Yes | import scan + vitest |
| C-004 | Modify | T-003 | No | `components/workspace/history/__tests__/WorkspaceAgentRunsTreePanel.spec.ts` |
| C-005 | Modify | T-004 | No | `composables/workspace/history/__tests__/useRunTreeViewState.spec.ts` |
| C-006 | Modify | T-006 | No | panel spec |
| C-007 | Modify | T-007 | Possible remove/repurpose | section specs |
| C-008 | Modify | T-008 | No | section specs |

## Decommission / Rename Execution Tasks
| Task ID | Item | Action (`Remove`/`Rename`/`Move`) | Cleanup Steps | Risk Notes |
| --- | --- | --- | --- | --- |
| T-005 | `components/workspace/history/TeamRunsSection.vue` | Remove | delete file, remove imports, remove dedicated obsolete tests | low risk; compile/test catches import leftovers |

## Step-By-Step Plan
1. Implement workspace-rooted team grouping in `runTreeStore` and extend workspace-node model to include `teams` subtree + fallback workspace bucket.
2. Move team branch rendering into `WorkspaceRunsSection.vue` and remove member workspace suffix display.
3. Simplify panel wiring to one section (`WorkspaceRunsSection`) and update view-state composable to remove global teams section state.
4. Remove obsolete `TeamRunsSection` module and rewrite affected specs to new render/event contracts.
5. Run targeted frontend unit specs for store/tree panel/view-state and fix regressions.

## Per-File Definition Of Done
| File | Implementation Done Criteria | Unit Test Criteria | Integration Test Criteria | E2E Criteria | Notes |
| --- | --- | --- | --- | --- | --- |
| `stores/runTreeStore.ts` | Workspace tree includes teams under workspace and fallback bucket logic | `runTreeStore.spec.ts` updated/passing | N/A | Manual smoke | Must preserve `selectTreeRun` behavior |
| `components/workspace/history/WorkspaceRunsSection.vue` | Renders workspace-scoped team branch and emits team/member events | section spec updated/passing | N/A | Manual smoke | Remove member workspace suffix |
| `components/workspace/history/WorkspaceAgentRunsTreePanel.vue` | No global teams section wiring remains | panel spec updated/passing | N/A | Manual smoke | emits remain unchanged |
| `composables/workspace/history/useRunTreeViewState.ts` | Obsolete team section state removed; expansions still work | composable spec passing | N/A | N/A | no store coupling |
| `components/workspace/history/TeamRunsSection.vue` | Removed with no references | N/A | N/A | N/A | cleanup verification via `rg` |

## Test Strategy
- Unit tests:
  - `stores/__tests__/runTreeStore.spec.ts`
  - `components/workspace/history/__tests__/WorkspaceRunsSection.spec.ts`
  - `components/workspace/history/__tests__/WorkspaceAgentRunsTreePanel.spec.ts`
  - `composables/workspace/history/__tests__/useRunTreeViewState.spec.ts`
- Integration tests: N/A (frontend unit scope only)
- E2E feasibility: `Not Feasible`
- If E2E is not feasible, concrete reason and current constraints:
  - No browser automation E2E suite exists in this repo for workspace tree flows in this worktree.
- Best-available non-E2E verification evidence when E2E is not feasible:
  - Targeted vitest coverage of store + panel + section interactions.
- Residual risk notes:
  - Visual spacing regressions may still require manual UI smoke.

## Test Feedback Escalation Policy (Execution Guardrail)
- Classification rules for failing tests:
  - `Local Fix`: bounded assertion or render contract bug.
  - `Design Impact`: tree projection boundary mismatch requiring design updates.
  - `Requirement Gap`: missing/ambiguous behavior contract.
- Required action:
  - `Local Fix` -> patch directly.
  - `Design Impact` -> update investigation notes, design, call stack, and re-review.
  - `Requirement Gap` -> update requirements (`Refined`) first, then design + call stack + review.

## Cross-Reference Exception Protocol
| File | Cross-Reference With | Why Unavoidable | Temporary Strategy | Unblock Condition | Design Follow-Up Status | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| N/A | N/A | N/A | N/A | N/A | Not Needed | N/A |

## Design Feedback Loop
| Smell/Issue | Evidence (Files/Call Stack) | Design Section To Update | Action | Status |
| --- | --- | --- | --- | --- |
| N/A | N/A | N/A | N/A | Pending |

## Reopen Addendum - 2026-02-20 (Team Member Continuation Context Restore)

### Trigger
- Post-implementation user validation found a blocking regression:
  - historical team member messages load in UI,
  - continued message after team restore behaves as a fresh session.

### Root Cause Summary
- Backend team continuation restore rebuilt members with deterministic `memberAgentId` but without `memoryDir` restore metadata.
- This prevented runtime from selecting `restoreAgent(...)` bootstrap path for team members, so prior working context was not loaded.

### Addendum Tasks
1. Update `autobyteus-server-ts/src/run-history/services/team-run-continuation-service.ts` to propagate restore memory directory into reconstructed member configs.
2. Update `autobyteus-server-ts/tests/unit/run-history/team-run-continuation-service.test.ts` to assert `memoryDir` propagation.
3. Update `autobyteus-server-ts/tests/integration/run-history/team-run-continuation-lifecycle.integration.test.ts` to assert restore member configs include `memoryDir`.
4. Re-run run-history endpoint-level E2E suite to verify continuation lifecycle contracts still pass.
5. Replace run-history E2E controller/team-manager lifecycle spies with real GraphQL fixture setup (prompt/agent/team definitions) so lifecycle behavior is exercised through actual manager paths.
6. Keep only deterministic seams required for test stability (LLM runtime creation + ingress dispatch), then re-run run-history unit/integration/E2E bundle.

### Addendum Verification Plan
- Unit:
  - `pnpm exec vitest run tests/unit/run-history/team-run-continuation-service.test.ts --no-watch`
- Integration:
  - `pnpm exec vitest run tests/integration/run-history/team-run-continuation-lifecycle.integration.test.ts --no-watch`
- E2E/Endpoint:
  - `pnpm exec vitest run tests/e2e/run-history/team-run-history-graphql.e2e.test.ts tests/e2e/run-history/team-run-restore-lifecycle-graphql.e2e.test.ts tests/e2e/run-history/team-member-projection-contract.e2e.test.ts tests/e2e/run-history/run-history-graphql.e2e.test.ts tests/integration/run-history/team-run-continuation-lifecycle.integration.test.ts --no-watch`
