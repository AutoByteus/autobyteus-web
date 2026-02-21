# Future-State Runtime Call Stacks (Debug-Trace Style)

## Conventions

- Frame format: `path/to/file.ts:functionName(args?)`
- Boundary tags:
  - `[ENTRY]` external entrypoint (UI/API/event)
  - `[ASYNC]` async boundary (`await`, stream handoff)
  - `[STATE]` in-memory mutation
  - `[IO]` file/network/database IO
  - `[FALLBACK]` non-primary branch
  - `[ERROR]` error path
- No backward-compatibility branches are modeled.

## Design Basis

- Scope Classification: `Medium`
- Call Stack Version: `v3`
- Requirements: `/Users/normy/autobyteus_org/autobyteus-worktrees/personal/autobyteus-web/tickets/in-progress/team-run-left-tree-visibility-personal/requirements.md` (status `Refined`)
- Source Design Artifact: `/Users/normy/autobyteus_org/autobyteus-worktrees/personal/autobyteus-web/tickets/in-progress/team-run-left-tree-visibility-personal/proposed-design.md`
- Source Design Version: `v3`
- Referenced Sections:
  - Current State / Target State
  - Change Inventory `C-001..C-009`
  - Use-Case Coverage Matrix `UC-001..UC-007`

## Future-State Modeling Rule (Mandatory)

- This document models the target personal architecture after enterprise-pattern adaptation.
- Where current code differs, target behavior is represented and transition notes capture interim constraints.

## Use Case Index (Stable IDs)

| use_case_id | Requirement | Use Case Name | Coverage Target (Primary/Fallback/Error) |
| --- | --- | --- | --- |
| UC-001 | R-001 | Run team appears under workspace immediately | Yes/Yes/Yes |
| UC-002 | R-001 | Temporary team id is promoted and remains visible | Yes/N/A/Yes |
| UC-003 | R-002 | Team row selection from workspace tree | Yes/Yes/Yes |
| UC-004 | R-002 | Team member focus selection from workspace tree | Yes/N/A/Yes |
| UC-005 | R-003 | Terminate team from workspace tree | Yes/N/A/Yes |
| UC-006 | R-004 | Reload persisted team history under workspace | Yes/Yes/Yes |
| UC-007 | R-003 | Delete inactive team history | Yes/N/A/Yes |
| UC-008 | R-005 | Persisted member offline continuation send | Yes/N/A/Yes |

## Transition Notes

- Existing personal frontend already renders live team rows from `agentTeamContextsStore`.
- Target state moves canonical team row projection to a unified store path (`runHistoryStore`) that merges persisted + live sources.
- Backend team-run history APIs/services are currently absent in personal and are part of target-state changes.

## Use Case: UC-001 [Run Team Appears Under Workspace Immediately]

### Goal

Show a new team row under the selected workspace immediately after user clicks `Run Team`.

### Preconditions

- Team run config is valid and has `workspaceId`.
- Workspace exists in workspace store.

### Expected Outcome

- Left workspace tree renders a team row with temporary id and member count.

### Primary Runtime Call Stack

```text
[ENTRY] components/workspace/config/RunConfigPanel.vue:handleRun()
├── stores/agentTeamContextsStore.ts:createInstanceFromTemplate() [STATE]
│   ├── stores/teamRunConfigStore.ts:config (read)
│   ├── stores/agentTeamDefinitionStore.ts:getAgentTeamDefinitionById(...) (read)
│   ├── stores/agentDefinitionStore.ts:getAgentDefinitionById(...) (read)
│   ├── stores/agentSelectionStore.ts:selectInstance(teamId, "team") [STATE]
│   └── stores/agentTeamContextsStore.ts:teams.set(teamId, context) [STATE]
├── stores/teamRunConfigStore.ts:clearConfig() [STATE]
└── components/workspace/history/WorkspaceAgentRunsTreePanel.vue:teamNodesByWorkspace(computed) [STATE]
    └── components/workspace/history/WorkspaceAgentRunsTreePanel.vue:workspaceTeams(workspaceRootPath) [STATE]
```

### Branching / Fallback Paths

```text
[FALLBACK] if workspace tree still has no persisted team rows
components/workspace/history/WorkspaceAgentRunsTreePanel.vue:teamNodesByWorkspace(computed)
└── stores/agentTeamContextsStore.ts:allTeamInstances (live-only projection) [STATE]
```

```text
[ERROR] if run config template is missing
stores/agentTeamContextsStore.ts:createInstanceFromTemplate()
└── components/workspace/config/RunConfigPanel.vue:handleRun() # surfaces run-blocking error
```

### State And Data Transformations

- Team run template -> `AgentTeamContext` with temporary `teamId`.
- `workspaceId` -> workspace root path lookup for row grouping.

### Observability And Debug Points

- UI console error on create-instance failure.
- Store mutation audit: new `teamId` present in `agentTeamContextsStore.teams`.

### Design Smells / Gaps

- Any legacy/backward-compatibility branch present? `No`
- Any naming-to-responsibility drift detected? `Yes` (`WorkspaceAgentRunsTreePanel.vue` includes both agent and team concerns)

### Open Questions

- None.

### Coverage Status

- Primary Path: `Covered`
- Fallback Path: `Covered`
- Error Path: `Covered`

## Use Case: UC-002 [Temporary Team Id Promotion Keeps Row Visible]

### Goal

After first message sends, temporary team id is promoted to permanent backend id and remains visible in left tree.

### Preconditions

- Active team is temporary (`teamId` starts with `temp-`).
- Focused member exists in active team context.

### Expected Outcome

- Left tree row switches identity to permanent id without disappearing.

### Primary Runtime Call Stack

```text
[ENTRY] stores/agentTeamRunStore.ts:sendMessageToFocusedMember(text, contextPaths)
├── stores/agentTeamRunStore.ts:build variables for SendMessageToTeam mutation [STATE]
├── graphql/mutations/agentTeamInstanceMutations.ts:SendMessageToTeam [IO]
├── [ASYNC] src/api/graphql/types/agent-team-instance.ts:sendMessageToTeam(input) [IO]
│   ├── src/agent-team-execution/services/agent-team-instance-manager.ts:createTeamInstance(...) [STATE]
│   ├── src/run-history/services/team-run-history-service.ts:upsertTeamRunHistoryRow(...) [IO]
│   └── src/run-history/services/team-run-history-service.ts:onTeamEvent(...) [IO]
├── stores/agentTeamContextsStore.ts:promoteTemporaryTeamId(tempId, permanentId) [STATE]
├── stores/agentTeamContextsStore.ts:lockConfig(permanentId) [STATE]
└── stores/agentTeamRunStore.ts:connectToTeamStream(permanentId) [ASYNC]
```

### Branching / Fallback Paths

```text
[FALLBACK] if mutation latency is high
components/workspace/history/WorkspaceAgentRunsTreePanel.vue:workspaceTeams(workspaceRootPath)
└── keeps rendering temporary context row until promoteTemporaryTeamId runs [STATE]
```

```text
[ERROR] if SendMessageToTeam fails
stores/agentTeamRunStore.ts:sendMessageToFocusedMember(...)
└── throw Error("Failed to send message ...") # temp row remains selected; no promotion
```

### State And Data Transformations

- Temporary context id -> permanent backend `teamId`.
- Local conversation append -> server user message payload.

### Observability And Debug Points

- Client logs mutation failure and promotion events.
- Backend logs lazy creation and team id returned.

### Design Smells / Gaps

- Any legacy/backward-compatibility branch present? `No`
- Any naming-to-responsibility drift detected? `No`

### Open Questions

- None.

### Coverage Status

- Primary Path: `Covered`
- Fallback Path: `N/A`
- Error Path: `Covered`

## Use Case: UC-003 [Team Row Selection From Workspace Tree]

### Goal

Selecting a team row focuses team context and keeps team panel in sync.

### Preconditions

- Team row is visible under workspace section.

### Expected Outcome

- Team is selected (`selectedType=team`) and instance-selected event is emitted.

### Primary Runtime Call Stack

```text
[ENTRY] components/workspace/history/WorkspaceAgentRunsTreePanel.vue:onSelectTeam(teamId)
├── components/workspace/history/WorkspaceAgentRunsTreePanel.vue:toggleTeam(teamId) [STATE]
├── stores/agentSelectionStore.ts:selectInstance(teamId, "team") [STATE]
├── stores/runHistoryStore.ts:openTeamMemberRun(teamId, defaultMemberRouteKey) [ASYNC]
└── components/workspace/history/WorkspaceAgentRunsTreePanel.vue:$emit("instance-selected", {type:"team", instanceId:teamId}) [ASYNC]
```

### Branching / Fallback Paths

```text
[FALLBACK] if selected team exists in persisted history only
stores/runHistoryStore.ts:openTeamMemberRun(teamId, memberRouteKey) [ASYNC]
└── hydrates team context before focus update [STATE]
```

```text
[ERROR] if selected team id cannot be resolved by projection
stores/runHistoryStore.ts:openTeamMemberRun(...)
└── set error state and toast: "Failed to open team run."
```

### State And Data Transformations

- UI row click -> global selection state (`teamId`, selected type).

### Observability And Debug Points

- Selection store reflects team id.
- Emitted event traced by parent layout/workspace router.

### Design Smells / Gaps

- Any legacy/backward-compatibility branch present? `No`
- Any naming-to-responsibility drift detected? `No`

### Open Questions

- None.

### Coverage Status

- Primary Path: `Covered`
- Fallback Path: `Covered`
- Error Path: `Covered`

## Use Case: UC-004 [Team Member Focus Selection]

### Goal

Clicking a team member sets focused member for message routing.

### Preconditions

- Team context exists and has member list.

### Expected Outcome

- `focusedMemberName` is updated and team remains selected.

### Primary Runtime Call Stack

```text
[ENTRY] components/workspace/history/WorkspaceAgentRunsTreePanel.vue:onSelectTeamMember(teamId, memberRouteKey)
├── stores/agentSelectionStore.ts:selectInstance(teamId, "team") [STATE]
├── stores/agentTeamContextsStore.ts:setFocusedMember(memberRouteKey) [STATE]
└── components/workspace/history/WorkspaceAgentRunsTreePanel.vue:$emit("instance-selected", {type:"team", instanceId:teamId}) [ASYNC]
```

### Branching / Fallback Paths

```text
[FALLBACK] none
```

```text
[ERROR] if memberRouteKey is absent from team context
stores/agentTeamContextsStore.ts:setFocusedMember(memberName)
└── no-op; UI should not mutate focused member
```

### State And Data Transformations

- Member route key -> active team `focusedMemberName`.

### Observability And Debug Points

- Team tab highlights selected member route key.

### Design Smells / Gaps

- Any legacy/backward-compatibility branch present? `No`
- Any naming-to-responsibility drift detected? `No`

### Open Questions

- None.

### Coverage Status

- Primary Path: `Covered`
- Fallback Path: `N/A`
- Error Path: `Covered`

## Use Case: UC-005 [Terminate Team From Workspace Tree]

### Goal

Terminate active team from left tree and synchronize active/inactive state with backend history.

### Preconditions

- Team is active and present in contexts store.

### Expected Outcome

- Team run is terminated and row state is updated/removed consistently.

### Primary Runtime Call Stack

```text
[ENTRY] components/workspace/history/WorkspaceAgentRunsTreePanel.vue:onTerminateTeam(teamId)
├── stores/agentTeamRunStore.ts:terminateTeamInstance(teamId) [ASYNC]
│   ├── stores/agentTeamRunStore.ts:teamContext.unsubscribe?.() [STATE]
│   ├── stores/agentTeamContextsStore.ts:removeTeamContext(teamId) [STATE]
│   ├── graphql/mutations/agentTeamInstanceMutations.ts:TerminateAgentTeamInstance [IO]
│   └── [ASYNC] src/api/graphql/types/agent-team-instance.ts:terminateAgentTeamInstance(id) [IO]
│       ├── src/agent-team-execution/services/agent-team-instance-manager.ts:terminateTeamInstance(id) [STATE]
│       └── src/run-history/services/team-run-history-service.ts:onTeamTerminated(teamId) [IO]
└── stores/runHistoryStore.ts:markTeamAsInactive(teamId) [STATE]
```

### Branching / Fallback Paths

```text
[FALLBACK] if temp team id has never been promoted
stores/agentTeamRunStore.ts:terminateTeamInstance(teamId)
└── return before backend mutation; remove local context only [STATE]
```

```text
[ERROR] if backend termination mutation fails
stores/agentTeamRunStore.ts:terminateTeamInstance(teamId)
└── console.error + UI toast; local context already removed
```

### State And Data Transformations

- Active team context -> removed from memory; persisted row status `ACTIVE` -> `IDLE`.

### Observability And Debug Points

- Team stream disconnect and remove context logs.
- Backend warns on termination failures.

### Design Smells / Gaps

- Any legacy/backward-compatibility branch present? `No`
- Any naming-to-responsibility drift detected? `No`

### Open Questions

- None.

### Coverage Status

- Primary Path: `Covered`
- Fallback Path: `N/A`
- Error Path: `Covered`

## Use Case: UC-006 [Reload Persisted Team History Under Workspace]

### Goal

After app refresh, persisted team rows are loaded from backend and grouped under workspace.

### Preconditions

- Backend exposes team-run-history query.
- Team history index/manifest exists on disk.

### Expected Outcome

- Workspace tree shows persisted team rows merged with live contexts.

### Primary Runtime Call Stack

```text
[ENTRY] components/workspace/history/WorkspaceAgentRunsTreePanel.vue:onMounted()
├── stores/workspace.ts:fetchAllWorkspaces() [ASYNC]
├── stores/runHistoryStore.ts:fetchTree(limitPerAgent) [ASYNC]
│   ├── utils/apolloClient.ts:getApolloClient()
│   ├── graphql/queries/runHistoryQueries.ts:ListRunHistory [IO]
│   ├── graphql/queries/runHistoryQueries.ts:ListTeamRunHistory [IO]
│   ├── [ASYNC] src/api/graphql/types/run-history.ts:listRunHistory(...) [IO]
│   ├── [ASYNC] src/api/graphql/types/team-run-history.ts:listTeamRunHistory() [IO]
│   │   └── src/run-history/services/team-run-history-service.ts:listTeamRunHistory() [IO]
│   ├── src/run-history/services/team-run-history-service.ts:resolveTeamWorkspaceRootPath(manifest) [STATE]
│   └── stores/runHistoryStore.ts:mergePersistedAndLiveTeamRowsByWorkspace(canonicalTeamWorkspaceRootPath) [STATE]
└── components/workspace/history/WorkspaceAgentRunsTreePanel.vue:workspaceTeams(workspaceRootPath) [STATE]
```

### Branching / Fallback Paths

```text
[FALLBACK] if no team history rows exist
src/run-history/services/team-run-history-service.ts:rebuildIndexFromDisk() [IO]
└── return empty rows and keep live contexts as source [STATE]
```

```text
[ERROR] if team history query fails while agent history succeeds
stores/runHistoryStore.ts:fetchTree(...)
└── preserve live team projection + surface non-blocking error state
```

### State And Data Transformations

- Team index rows + manifests -> team row DTO -> workspace-grouped team projection.

### Observability And Debug Points

- `runHistoryStore.loading/error` state transitions.
- Backend index rebuild warnings if manifests are missing.

### Design Smells / Gaps

- Any legacy/backward-compatibility branch present? `No`
- Any naming-to-responsibility drift detected? `No`

### Open Questions

- None.

### Coverage Status

- Primary Path: `Covered`
- Fallback Path: `Covered`
- Error Path: `Covered`

## Use Case: UC-007 [Delete Inactive Team History]

### Goal

Allow deleting inactive team run history from UI and persistence storage.

### Preconditions

- Team run is inactive.
- Team row supports delete action.

### Expected Outcome

- Team history row and manifest directory are removed; row disappears from left tree.

### Primary Runtime Call Stack

```text
[ENTRY] components/workspace/history/WorkspaceAgentRunsTreePanel.vue:onDeleteTeamHistory(teamId)
├── stores/runHistoryStore.ts:deleteTeamHistory(teamId) [ASYNC]
│   ├── graphql/mutations/runHistoryMutations.ts:DeleteTeamRunHistory [IO]
│   ├── [ASYNC] src/api/graphql/types/team-run-history.ts:deleteTeamRunHistory(teamId) [IO]
│   │   └── src/run-history/services/team-run-history-service.ts:deleteTeamRunHistory(teamId) [IO]
│   │       ├── src/run-history/store/team-run-index-store.ts:removeRow(teamId) [IO]
│   │       └── node:fs/promises:rm(teamPath, {recursive:true, force:true}) [IO]
│   └── stores/runHistoryStore.ts:removeTeamRunById(teamId) [STATE]
└── components/workspace/history/WorkspaceAgentRunsTreePanel.vue:addToast("Team run deleted permanently") [STATE]
```

### Branching / Fallback Paths

```text
[FALLBACK] none
```

```text
[ERROR] if team is still active
src/run-history/services/team-run-history-service.ts:deleteTeamRunHistory(teamId)
└── return {success:false, message:"Team run is active. Terminate it before deleting history."}
```

### State And Data Transformations

- Team id -> persisted directory path -> deletion outcome object.

### Observability And Debug Points

- Delete mutation result logged and toast surfaced.
- Backend warning log on filesystem deletion failure.

### Design Smells / Gaps

- Any legacy/backward-compatibility branch present? `No`
- Any naming-to-responsibility drift detected? `No`

### Open Questions

- None.

### Coverage Status

- Primary Path: `Covered`
- Fallback Path: `N/A`
- Error Path: `Covered`

## Use Case: UC-008 [Persisted Member Offline Continuation Send]

### Goal

When user clicks a persisted/offline team member, history loads and user can continue sending messages to that specific member in personal mode.

### Preconditions

- Team run exists in persisted history but runtime may be offline/idle.
- User selected a specific member row in workspace tree.

### Expected Outcome

- Member conversation history is hydrated.
- Sending a message routes to selected member and succeeds even if team runtime was offline before send.

### Primary Runtime Call Stack

```text
[ENTRY] components/workspace/history/WorkspaceAgentRunsTreePanel.vue:onSelectTeamMember(teamId, memberRouteKey)
├── stores/agentSelectionStore.ts:selectInstance(teamId, "team") [STATE]
├── stores/agentTeamContextsStore.ts:setFocusedMember(memberRouteKey) [STATE]
├── stores/runHistoryStore.ts:openTeamMemberRun(teamId, memberRouteKey) [ASYNC]
│   ├── graphql/queries/runHistoryQueries.ts:GetTeamRunResumeConfig [IO]
│   ├── graphql/queries/runHistoryQueries.ts:GetTeamMemberRunProjection [IO]
│   ├── [ASYNC] src/api/graphql/types/team-run-history.ts:getTeamRunResumeConfig(teamId) [IO]
│   ├── [ASYNC] src/api/graphql/types/team-run-history.ts:getTeamMemberRunProjection(teamId, memberRouteKey) [IO]
│   └── stores/agentTeamContextsStore.ts:addTeamContext(hydratedContext) [STATE]
├── stores/activeContextStore.ts:send() [ENTRY]
│   └── stores/agentTeamRunStore.ts:sendMessageToFocusedMember(text, contextPaths) [ASYNC]
│       ├── graphql/mutations/agentTeamInstanceMutations.ts:SendMessageToTeam(input={teamId,targetMemberName}) [IO]
│       └── [ASYNC] src/api/graphql/types/agent-team-instance.ts:sendMessageToTeam(input) [IO]
│           ├── src/run-history/services/team-run-continuation-service.ts:continueTeamRun({teamId,targetMemberRouteKey,userInput}) [ASYNC]
│           ├── src/agent-team-execution/services/agent-team-instance-manager.ts:createTeamInstanceWithId(...) [STATE]
│           ├── src/run-history/services/team-run-history-service.ts:onTeamEvent(teamId,{status:"ACTIVE"}) [IO]
│           └── src/agent-team-execution/services/default-team-command-ingress-service.ts:dispatchUserMessage(...) [ASYNC]
└── stores/agentTeamContextsStore.ts:focusedMemberContext.state.conversation.messages.push(...) [STATE]
```

### Branching / Fallback Paths

```text
[FALLBACK] if team runtime is already active
src/api/graphql/types/agent-team-instance.ts:sendMessageToTeam(input)
└── bypass continuation create and dispatch directly to active runtime
```

```text
[ERROR] if persisted manifest/member binding not found
src/run-history/services/team-run-continuation-service.ts:continueTeamRun(...)
└── throw continuation error -> sendMessageToTeam returns success=false and message
```

### State And Data Transformations

- Persisted team manifest + member projection -> hydrated team context.
- User input payload -> routed message for `targetMemberName/memberRouteKey`.

### Observability And Debug Points

- Continuation path log: team resumed from history vs already active.
- UI error toast path when continuation cannot resolve manifest/member.

### Design Smells / Gaps

- Any legacy/backward-compatibility branch present? `No`
- Any naming-to-responsibility drift detected? `No`

### Open Questions

- None.

### Coverage Status

- Primary Path: `Covered`
- Fallback Path: `N/A`
- Error Path: `Covered`
