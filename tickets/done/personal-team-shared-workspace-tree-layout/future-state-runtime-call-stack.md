# Future-State Runtime Call Stacks (Debug-Trace Style)

## Conventions
- Frame format: `path/to/file.ts:functionName(...)`
- Boundary tags:
  - `[ENTRY]` external entrypoint
  - `[ASYNC]` async boundary
  - `[STATE]` in-memory mutation
  - `[IO]` network/file/cache IO
  - `[FALLBACK]` non-primary branch
  - `[ERROR]` error path

## Design Basis
- Scope Classification: `Medium`
- Call Stack Version: `v1`
- Requirements: `tickets/in-progress/personal-team-shared-workspace-tree-layout/requirements.md` (status `Design-ready`)
- Source Artifact: `tickets/in-progress/personal-team-shared-workspace-tree-layout/proposed-design.md`
- Source Design Version: `v1`
- Referenced Sections:
  - Target State
  - Change Inventory (`C-001`..`C-008`)
  - Use-Case Coverage Matrix

## Future-State Modeling Rule (Mandatory)
- These call stacks model target behavior after workspace-rooted team tree refactor.
- Current separate `TeamRunsSection` rendering path is treated as decommissioned.

## Use Case Index (Stable IDs)
| use_case_id | Requirement | Use Case Name | Coverage Target (Primary/Fallback/Error) |
| --- | --- | --- | --- |
| UC-001 | R-001,R-002,R-007 | Render workspace-rooted agent and team history tree | Yes/N/A/N/A |
| UC-002 | R-002,R-003 | Select team member row and open member history | Yes/N/A/Yes |
| UC-003 | R-004 | Terminate/delete team run from workspace subtree | Yes/N/A/Yes |
| UC-004 | R-005 | Render team member row without workspace suffix | Yes/N/A/N/A |
| UC-005 | R-006 | Group unresolved team rows into fallback workspace bucket | Yes/Yes/N/A |

## Transition Notes
- Remove global `TeamRunsSection` render path in panel and route all team-tree rendering through `WorkspaceRunsSection`.
- Keep GraphQL payload unchanged; only frontend projection + rendering boundaries change.

## Use Case: UC-001 Render workspace-rooted agent and team history tree

### Goal
Show both agent runs and team runs under workspace nodes in left tree.

### Preconditions
- Workspace list and run history fetches are successful.

### Expected Outcome
- Workspace node renders agent subtree and team subtree under same workspace root.

### Primary Runtime Call Stack
```text
[ENTRY] components/workspace/history/WorkspaceAgentRunsTreePanel.vue:onMounted()
├── composables/workspace/history/useRunTreeActions.ts:initializePanelData() [ASYNC]
│   ├── stores/workspace.ts:fetchAllWorkspaces() [ASYNC][IO]
│   └── stores/runTreeStore.ts:fetchTree() [ASYNC][IO]
│       ├── graphql/queries/runHistoryQueries.ts:ListRunHistory
│       └── graphql/queries/runHistoryQueries.ts:ListTeamRunHistory
├── stores/runTreeStore.ts:getWorkspaceTreeNodes() [STATE]
│   ├── stores/runTreeStore.ts:buildWorkspaceDescriptors(...) [STATE]
│   ├── utils/runTreeProjection.ts:buildRunTreeProjection(...) [STATE]
│   └── stores/runTreeStore.ts:mergeTeamsIntoWorkspaceNodes(...) [STATE]
└── components/workspace/history/WorkspaceRunsSection.vue:renderWorkspaceNode(...) [STATE]
```

### Branching / Fallback Paths
- N/A

### State And Data Transformations
- GraphQL `listTeamRunHistory` rows -> `TeamTreeNode` map -> workspace-keyed `teams[]` subtree.
- Workspace descriptors + run projection -> unified `WorkspaceRunTreeNode` list.

### Observability And Debug Points
- `runTreeStore.error` is set on fetch failures.
- Component shows loading/error placeholders based on store state.

### Coverage Status
- Primary Path: `Covered`
- Fallback Path: `N/A`
- Error Path: `N/A`

## Use Case: UC-002 Select team member row and open member history

### Goal
Open selected member history from team subtree row under workspace.

### Preconditions
- Team row and member row are visible in workspace subtree.

### Expected Outcome
- Member conversation becomes active in center panel.

### Primary Runtime Call Stack
```text
[ENTRY] components/workspace/history/WorkspaceRunsSection.vue:@click(select-member)
├── composables/workspace/history/useRunTreeActions.ts:selectTeamMember(member) [ASYNC]
│   └── stores/runTreeStore.ts:selectTreeRun(member) [ASYNC]
│       └── stores/runTreeStore.ts:openTeamMemberRun(teamId, memberRouteKey) [ASYNC]
│           ├── graphql/queries/runHistoryQueries.ts:GetTeamRunResumeConfig [IO]
│           ├── graphql/queries/runHistoryQueries.ts:GetTeamMemberRunProjection [IO]
│           ├── stores/runTreeStore.ts:ensureWorkspaceByRootPath(...) [ASYNC][STATE]
│           ├── stores/agentTeamContextsStore.ts:addTeamContext(...) [STATE]
│           └── stores/agentSelectionStore.ts:selectInstance(teamId, 'team') [STATE]
└── components/workspace/history/WorkspaceAgentRunsTreePanel.vue:emit('instance-selected', {type:'team'})
```

### Branching / Fallback Paths
- N/A

### Error Path
```text
[ERROR] GetTeamMemberRunProjection fails for one member
stores/runTreeStore.ts:openTeamMemberRun(...)
├── catches projection error per member
├── stores null projection for that member [STATE]
└── builds empty conversation fallback for that member [STATE]
```

### State And Data Transformations
- Team manifest bindings -> member `AgentContext` map.
- Projection conversation payload -> `Conversation` model via `buildConversationFromProjection`.

### Coverage Status
- Primary Path: `Covered`
- Fallback Path: `N/A`
- Error Path: `Covered`

## Use Case: UC-003 Terminate/delete team run from workspace subtree

### Goal
Keep team controls functional after moving rows under workspace.

### Preconditions
- Team row is rendered under workspace node.

### Expected Outcome
- Terminate and delete actions execute same backend operations as before.

### Primary Runtime Call Stack
```text
[ENTRY] components/workspace/history/WorkspaceRunsSection.vue:@click(terminate-team/delete-team)
├── composables/workspace/history/useRunTreeActions.ts:terminateTeam(teamId) [ASYNC]
│   └── stores/agentTeamRunStore.ts:terminateTeamInstance(teamId) [ASYNC][IO]
└── composables/workspace/history/useRunTreeActions.ts:confirmDelete() [ASYNC]
    └── stores/runTreeStore.ts:deleteTeamRun(teamId) [ASYNC][IO]
        ├── graphql/mutations/runHistoryMutations.ts:DeleteTeamRunHistory
        └── stores/runTreeStore.ts:refreshTreeQuietly() [ASYNC][IO]
```

### Error Path
```text
[ERROR] terminate/delete mutation fails
composables/workspace/history/useRunTreeActions.ts:terminateTeam/confirmDelete
└── composables/useToasts.ts:addToast("Failed ...", 'error')
```

### Coverage Status
- Primary Path: `Covered`
- Fallback Path: `N/A`
- Error Path: `Covered`

## Use Case: UC-004 Render member row without workspace suffix

### Goal
Remove redundant member workspace text in personal workspace tree.

### Preconditions
- Member row is rendered within workspace team subtree.

### Expected Outcome
- Member row shows status/member name/time (and optional host node), but no workspace leaf text.

### Primary Runtime Call Stack
```text
[ENTRY] components/workspace/history/WorkspaceRunsSection.vue:renderTeamMemberRow(member)
├── uses member display fields (name/status/time)
├── omits workspacePathLeafName(member.workspaceRootPath)
└── renders compact row markup [STATE]
```

### Coverage Status
- Primary Path: `Covered`
- Fallback Path: `N/A`
- Error Path: `N/A`

## Use Case: UC-005 Group unresolved team rows into fallback workspace bucket

### Goal
Prevent orphaned or hidden team history rows when workspace root cannot be resolved.

### Preconditions
- Team history row exists but member bindings have missing/invalid workspace root path.

### Expected Outcome
- Team appears under fallback workspace bucket `Unassigned Team Workspace`.

### Primary Runtime Call Stack
```text
[ENTRY] stores/runTreeStore.ts:mergeTeamsIntoWorkspaceNodes(workspaceNodes, teamNodes)
├── stores/runTreeStore.ts:resolveTeamWorkspaceRoot(teamNode) [STATE]
│   ├── select first valid normalized member workspace root
│   └── returns null if unresolved
├── [FALLBACK] if unresolved
│   └── stores/runTreeStore.ts:ensureWorkspaceBucket('unassigned-team-workspace', 'Unassigned Team Workspace') [STATE]
└── append team node into workspace bucket teams[] [STATE]
```

### Branching / Fallback Paths
```text
[FALLBACK] team has mixed roots
stores/runTreeStore.ts:resolveTeamWorkspaceRoot(teamNode)
└── chooses deterministic first valid normalized root for grouping
```

### Coverage Status
- Primary Path: `Covered`
- Fallback Path: `Covered`
- Error Path: `N/A`
