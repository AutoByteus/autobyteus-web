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
│   ├── SkillsList.vue                  # Skills listing with cards
│   ├── SkillCard.vue                   # Individual skill card
│   ├── SkillDetail.vue                 # Skill explorer & file viewer
│   └── SkillFileTreeItem.vue           # File tree node component
├── stores/
│   └── skillStore.ts                   # Skills CRUD and file management
└── graphql/
    ├── queries/skillQueries.ts
    └── mutations/skillMutations.ts
```

## Navigation

Skills is a **standalone top-level module** accessible via the main sidebar (wrench/screwdriver icon). It is independent from the Prompt Engineering module.

**Route:** `/skills`

## View Modes

The skills page uses component-based navigation (not URL query parameters):

| View             | Component   | Description                    |
| ---------------- | ----------- | ------------------------------ |
| `list` (default) | SkillsList  | Browse available skills        |
| `detail`         | SkillDetail | View/edit files within a skill |

## UI Components

### SkillDetail Toolbar

The `SkillDetail.vue` component uses Heroicons for action buttons:

| Action | Icon (Heroicons) | Description                |
| ------ | ---------------- | -------------------------- |
| Add    | `PlusIcon`       | Add new file to skill      |
| Edit   | `PencilIcon`     | Edit selected file content |
| Delete | `TrashIcon`      | Delete selected file       |
| Save   | `CheckIcon`      | Save file changes          |

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

## Related Documentation

- **[Agent Management](./agent_management.md)**: Skills are attached to agents to provide capabilities.
- **[File Explorer](./file_explorer.md)**: Skills are essentially files (scripts) managed within the file system.
