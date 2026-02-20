# Proposed Design Document

## Design Version
- Current Version: `v1`

## Revision History
| Version | Trigger | Summary Of Changes | Related Review Round |
| --- | --- | --- | --- |
| v1 | Initial draft | Define workspace-rooted team history layout for personal UX and remove global teams section path. | 1 |

## Artifact Basis
- Investigation Notes: `tickets/in-progress/personal-team-shared-workspace-tree-layout/investigation-notes.md`
- Requirements: `tickets/in-progress/personal-team-shared-workspace-tree-layout/requirements.md`
- Requirements Status: `Design-ready`

## Summary
Refactor the workspace history tree so team runs are grouped under workspace nodes instead of a global `Teams` section. Keep existing run-open contracts, keep backend payload unchanged, and remove redundant member workspace label rendering for personal shared-workspace UX.

## Goals
- Present one workspace-first tree model for both single-agent and team runs.
- Preserve team member open/history behavior and team action controls.
- Remove visual redundancy (`member.workspaceRootPath` suffix) for personal mode workspace tree.
- Keep unresolved-path team history visible via deterministic fallback workspace bucket.

## Legacy Removal Policy (Mandatory)
- Policy: `No backward compatibility; remove legacy code paths.`
- Required action: remove global top-level `Teams` rendering path from workspace history panel in this branch.

## Requirements And Use Cases
| Requirement | Description | Acceptance Criteria | Use Case IDs |
| --- | --- | --- | --- |
| R-001 | Workspace-first IA for both agent and team runs | AC1 | UC-001 |
| R-002 | Team rows grouped under workspace and expandable | AC1, AC2 | UC-001, UC-002 |
| R-003 | Member selection/open behavior unchanged | AC2 | UC-002 |
| R-004 | Team terminate/delete actions preserved | AC3 | UC-003 |
| R-005 | Remove member workspace suffix display | AC4 | UC-004 |
| R-006 | Deterministic fallback for unresolved team workspace | AC5 | UC-005 |
| R-007 | Single-agent tree unchanged | AC6 | UC-001 |
| R-008 | Regression tests updated for new IA | AC7 | UC-001, UC-002, UC-003, UC-004, UC-005 |

## Codebase Understanding Snapshot (Pre-Design Mandatory)
| Area | Findings | Evidence (files/functions) | Open Unknowns |
| --- | --- | --- | --- |
| Entrypoints / Boundaries | `WorkspaceAgentRunsTreePanel` currently renders `WorkspaceRunsSection` + separate `TeamRunsSection`. | `components/workspace/history/WorkspaceAgentRunsTreePanel.vue` | None |
| Current Naming Conventions | `runTreeStore` is canonical store; team nodes are modeled separately from workspace nodes. | `stores/runTreeStore.ts:getTreeNodes`, `stores/runTreeStore.ts:getTeamNodes` | None |
| Impacted Modules / Responsibilities | Team display layout split across dedicated section component and view-state toggles. | `components/workspace/history/TeamRunsSection.vue`, `composables/workspace/history/useRunTreeViewState.ts` | None |
| Data / Persistence / External IO | Team history payload includes member workspace metadata and member route keys; backend contract already sufficient. | `graphql/queries/runHistoryQueries.ts`, `src/api/graphql/types/team-run-history.ts` | None |

## Current State (As-Is)
- Workspace section displays only single-agent runs.
- Teams section is separate top-level tree block with per-member workspace leaf label.
- Team expansion state has separate global map (`expandedTeams`) and section toggle (`teamsSectionExpanded`).

## Target State (To-Be)
- Each workspace node contains:
  - agent groups/runs (existing behavior)
  - a `teams` subsection scoped to that workspace with team rows and member rows.
- No global top-level `Teams` section.
- Team member row display omits workspace suffix text.
- Team rows with unresolved workspace are rendered under fallback workspace node:
  - key: `unassigned-team-workspace`
  - label: `Unassigned Team Workspace`

## Change Inventory (Delta)
| Change ID | Change Type (`Add`/`Modify`/`Rename/Move`/`Remove`) | Current Path | Target Path | Rationale | Impacted Areas | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| C-001 | Modify | `stores/runTreeStore.ts` | same | Build workspace-rooted team projection and expose combined workspace tree model. | state projection, selection path | adds workspace team grouping model |
| C-002 | Modify | `components/workspace/history/WorkspaceRunsSection.vue` | same | Render workspace-scoped team subsection and emit team/member actions. | tree UI rendering | absorbs team rendering responsibility |
| C-003 | Remove | `components/workspace/history/TeamRunsSection.vue` | N/A | Eliminate global teams root path. | UI IA cleanup | remove obsolete component |
| C-004 | Modify | `components/workspace/history/WorkspaceAgentRunsTreePanel.vue` | same | Remove `TeamRunsSection` wiring and global team expansion props. | composition root | workspace-only section wiring |
| C-005 | Modify | `composables/workspace/history/useRunTreeViewState.ts` | same | Remove global team section expansion state; add workspace-team expansion keys if needed. | view state boundary | no dual expansion mode |
| C-006 | Modify | `components/workspace/history/__tests__/WorkspaceAgentRunsTreePanel.spec.ts` | same | Update assertions from global `Teams` section to workspace-rooted team subtree. | UI regression tests | preserve action/selection checks |
| C-007 | Modify | `components/workspace/history/__tests__/TeamRunsSection.spec.ts` | same path or replace with `WorkspaceRunsSection` tests | Remove workspace leaf expectation and migrate coverage to workspace-scoped rendering. | component tests | may delete or repurpose file |
| C-008 | Modify | `components/workspace/history/__tests__/WorkspaceRunsSection.spec.ts` | same | Add workspace-rooted team rendering/emit coverage. | component tests | new team subsection assertions |

## Architecture Overview
`WorkspaceAgentRunsTreePanel` remains composition root, but `WorkspaceRunsSection` becomes the single tree renderer for both agent and team branches under each workspace node.

## File And Module Breakdown
| File/Module | Change Type | Concern / Responsibility | Public APIs | Inputs/Outputs | Dependencies |
| --- | --- | --- | --- | --- | --- |
| `stores/runTreeStore.ts` | Modify | Project workspace-rooted agent + team nodes from persisted history + live contexts. | `getTreeNodes()` (or equivalent combined getter), `selectTreeRun(...)` | in: history payloads; out: unified workspace nodes | Apollo GraphQL, team/agent context stores |
| `components/workspace/history/WorkspaceRunsSection.vue` | Modify | Render workspace -> agents/runs and workspace -> teams/members branches. | props/emits for toggle/select/create/terminate/delete | in: workspace nodes + state maps; out: user intents | display helpers |
| `components/workspace/history/WorkspaceAgentRunsTreePanel.vue` | Modify | Wire unified section and action/view-state composables. | emits unchanged | in: store projections; out: `instance-selected`, `instance-created` | runTree store + composables |
| `composables/workspace/history/useRunTreeViewState.ts` | Modify | Expansion state for workspace and nested workspace-team nodes. | toggle helpers | in: keys; out: reactive expansion maps | none |
| `components/workspace/history/TeamRunsSection.vue` | Remove | Obsolete global team section renderer. | N/A | N/A | N/A |

## Layer-Appropriate Separation Of Concerns Check
- UI/frontend scope: view responsibility stays at section component level; projection remains in store.
- Non-UI scope: store owns data shape and grouping decisions.
- Integration scope: GraphQL contracts unchanged; no new boundary.

## Naming Decisions (Natural And Implementation-Friendly)
| Item Type (`File`/`Module`/`API`) | Current Name | Proposed Name | Reason | Notes |
| --- | --- | --- | --- | --- |
| Store getter model | `workspaceNodes` + separate `teamNodes` consumption | unified workspace nodes with `teams` branch | matches workspace-first IA | avoids dual top-level tree concepts |
| Fallback workspace key | N/A | `unassigned-team-workspace` | deterministic grouping for unresolved paths | internal grouping key |
| Fallback workspace label | N/A | `Unassigned Team Workspace` | user-visible explicit bucket | stable test target |

## Naming Drift Check (Mandatory)
| Item | Current Responsibility | Does Name Still Match? (`Yes`/`No`) | Corrective Action (`Rename`/`Split`/`Move`/`N/A`) | Mapped Change ID |
| --- | --- | --- | --- | --- |
| `TeamRunsSection.vue` | Global team root rendering | No | Remove | C-003 |
| `WorkspaceRunsSection.vue` | Workspace + agent rendering only | No | Expand responsibility to workspace-scoped teams | C-002 |
| `runTreeStore.getTeamNodes` usage in panel | Top-level team projection path | No | Fold into workspace-rooted projection usage | C-001, C-004 |

## Dependency Flow And Cross-Reference Risk
| Module/File | Upstream Dependencies | Downstream Dependents | Cross-Reference Risk | Mitigation / Boundary Strategy |
| --- | --- | --- | --- | --- |
| `runTreeStore.ts` | GraphQL data + contexts | workspace tree UI | Medium | Keep grouping pure and deterministic; avoid UI logic in store |
| `WorkspaceRunsSection.vue` | unified node props | panel root | Low | render-only with event emits |
| `WorkspaceAgentRunsTreePanel.vue` | store getters + actions + view state | workspace layout | Low | orchestration only |
| `useRunTreeViewState.ts` | none | panel + section | Low | key-based state only |

## Decommission / Cleanup Plan
| Item To Remove/Rename | Cleanup Actions | Legacy Removal Notes | Verification |
| --- | --- | --- | --- |
| `TeamRunsSection.vue` global path | Remove import, template usage, tests tied only to global root behavior | No dual global-vs-workspace team render retained | `rg -n "TeamRunsSection" components/workspace/history` and targeted vitest |
| Member workspace leaf label in team row | Remove row text and related expectations | prevent redundant workspace display in personal tree | updated component spec assertions |
| Global team expansion state | Remove `teamsSectionExpanded` + `expandedTeams` branches where obsolete | single expansion model remains | view-state tests |

## Error Handling And Edge Cases
- If team workspace root cannot be resolved from members, row is assigned to fallback workspace bucket instead of disappearing.
- If member projection fetch fails on open, existing fallback empty-conversation behavior remains unchanged.
- Team action failures continue existing toast/error behavior in `useRunTreeActions`.

## Use-Case Coverage Matrix (Design Gate)
| use_case_id | Requirement | Use Case | Primary Path Covered (`Yes`/`No`) | Fallback Path Covered (`Yes`/`No`/`N/A`) | Error Path Covered (`Yes`/`No`/`N/A`) | Runtime Call Stack Section |
| --- | --- | --- | --- | --- | --- | --- |
| UC-001 | R-001,R-002,R-007 | Workspace tree renders agent + team branches | Yes | N/A | N/A | UC-001 |
| UC-002 | R-002,R-003 | Team member selection opens member history | Yes | N/A | Yes | UC-002 |
| UC-003 | R-004 | Team terminate/delete actions from workspace subtree | Yes | N/A | Yes | UC-003 |
| UC-004 | R-005 | Member rows omit workspace suffix text | Yes | N/A | N/A | UC-004 |
| UC-005 | R-006 | Missing workspace path grouped into fallback workspace | Yes | Yes | N/A | UC-005 |

## Performance / Security Considerations
- No new network calls.
- Tree render complexity increases slightly inside workspace section but removes separate section render pass.
- No new security surface.

## Migration / Rollout (If Needed)
- Single change set in this branch, no feature flag.
- Existing persisted run/team history remains compatible because input data contracts are unchanged.

## Change Traceability To Implementation Plan
| Change ID | Implementation Plan Task(s) | Verification (Unit/Integration/E2E/Manual) | Status |
| --- | --- | --- | --- |
| C-001 | T-001 | store unit tests | Planned |
| C-002 | T-002 | section component tests | Planned |
| C-003 | T-003 | import scan + removed tests | Planned |
| C-004 | T-004 | panel integration tests | Planned |
| C-005 | T-005 | view-state tests | Planned |
| C-006 | T-006 | panel spec | Planned |
| C-007 | T-007 | section spec updates | Planned |
| C-008 | T-008 | WorkspaceRunsSection spec updates | Planned |

## Design Feedback Loop Notes (From Review/Implementation)
| Date | Trigger (Review/File/Test/Blocker) | Classification (`Local Fix`/`Design Impact`/`Requirement Gap`) | Design Smell | Requirements Updated? | Design Update Applied | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-02-20 | Initial design pass | N/A | N/A | No | v1 created | Open |

## Open Questions
- None blocking for v1 design.
