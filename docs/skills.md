# Skills Management - Frontend

This document describes the design and implementation of the **Skills Management** module in the autobyteus-web frontend.

## Overview

The Skills module allows users to:

- View available skills (file-based capabilities).
- View the content of skill files (scripts, docs).
- Create new skills.
- Edit skill files directly in the browser.
- Assign skills to agents during agent creation.

## Module Structure

```
autobyteus-web/
├── pages/
│   └── skills.vue                      # Main skills management page
├── components/skills/
│   ├── SkillList.vue                   # Skills listing
│   ├── SkillDetail.vue                 # Skill explorer & file viewer
│   ├── SkillCreate.vue                 # Create new skill form
│   ├── SkillFileEdit.vue               # File editor for skill assets
│   ├── FileContentViewer.vue           # Read-only viewer (shared)
│   └── CreateFileModal.vue             # Add new file to skill
├── stores/
│   └── skillStore.ts                   # Skills CRUD and file management
└── graphql/
    ├── queries/skillQueries.ts
    └── mutations/skillMutations.ts
```

## View Modes

The skills page uses URL query parameters for navigation:

| View             | Component     | Description                     |
| ---------------- | ------------- | ------------------------------- |
| `list` (default) | SkillList     | Browse available skills         |
| `create`         | SkillCreate   | Create new skill directory      |
| `detail`         | SkillDetail   | View files within a skill       |
| `edit-file`      | SkillFileEdit | Edit content of a specific file |

## Data Models

### Skill

```typescript
interface Skill {
  name: string;
  description: string;
  content: string; // Content of SKILL.md
  rootPath: string;
  fileCount: number;
  createdAt: string;
  updatedAt: string;
}
```

## State Management

### skillStore.ts

Manages skill state and file system interactions specific to skills.

**Actions:**

| Action                     | Description                               |
| :------------------------- | :---------------------------------------- |
| `fetchAllSkills()`         | Load all skills from the server.          |
| `fetchSkill(name)`         | Load a specific skill by name.            |
| `createSkill(payload)`     | Create a new skill directory + SKILL.md.  |
| `updateSkillFile(payload)` | Write content to a file in the skill dir. |
| `deleteSkill(name)`        | Delete the entire skill directory.        |
| `deleteSkillFile(payload)` | Delete a specific file within a skill.    |

## Agent Integration

### Agent Creation Form

The `AgentDefinitionForm.vue` component includes a "Skills Configuration" section.
It calls `skillStore.fetchAllSkills()` to populate the available skills.

- **Component**: `GroupableTagInput`
- **Data Field**: `skillNames` (List of strings)

When an agent is created, the selected `skillNames` are sent to the backend `AgentDefinition`.
