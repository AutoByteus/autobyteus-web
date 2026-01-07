<template>
  <div v-if="!skill" class="loading-state">
    <div class="spinner"></div>
    <p>Loading...</p>
  </div>
  <div v-else class="skill-detail">
    <!-- Header -->
    <div class="top-bar">
      <div class="breadcrumbs">
        <button class="btn-back" @click="$emit('back')">
          <Icon icon="heroicons:arrow-left" class="back-icon" />
          Back to Skills
        </button>
      </div>
      <div class="header-main">
        <div class="title-row">
          <h2 class="skill-title">{{ skill.name }}</h2>
          <span v-if="skill.isDisabled" class="badge-disabled">Disabled</span>
        </div>
        <p class="description">{{ skill.description }}</p>
      </div>
    </div>

    <!-- Main Workspace -->
    <SkillWorkspaceLoader :skillId="skill.name">
        <template #default="{ workspaceId }">
            <div class="workspace">
            <!-- Left: File Sidebar -->
            <div class="sidebar">
                <FileExplorer :workspaceId="workspaceId" />
            </div>

            <!-- Right: Editor/Viewer -->
            <div class="editor-pane">
                <FileContentViewer :workspaceId="workspaceId" />
            </div>
            </div>
        </template>
    </SkillWorkspaceLoader>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useSkillStore } from '~/stores/skillStore'
import { Icon } from '@iconify/vue'
import SkillWorkspaceLoader from './SkillWorkspaceLoader.vue'
import FileExplorer from '~/components/fileExplorer/FileExplorer.vue'
import FileContentViewer from '~/components/fileExplorer/FileContentViewer.vue'
import type { Skill } from '~/types/skill'

const props = defineProps<{
  skillName: string
}>()

const emit = defineEmits<{
  back: []
}>()

const skillStore = useSkillStore()
const skill = ref<Skill | null>(null)

// Lifecycle and Methods
onMounted(async () => {
  await loadSkillDetails()
})

watch(() => props.skillName, async () => {
  await loadSkillDetails()
})

async function loadSkillDetails() {
  skill.value = await skillStore.fetchSkill(props.skillName)
  // No need to fetch manual file tree anymore!
}
</script>

<style scoped>
.skill-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  overflow: hidden;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

/* Header */
.top-bar {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  background: white;
  flex-shrink: 0;
}

.breadcrumbs {
  margin-bottom: 1rem;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.2s;
}

.btn-back:hover {
  color: #111827;
}

.header-main {
  max-width: 800px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.skill-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

.badge-disabled {
  background: #f3f4f6;
  color: #6b7280;
  font-size: 0.75rem;
  padding: 0.125rem 0.625rem;
  border-radius: 9999px;
  font-weight: 500;
}

.description {
  margin: 0;
  color: #6b7280;
  line-height: 1.5;
}

/* Workspace */
.workspace {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0; /* Important for nested flex scroll */
  height: 100%; /* Ensure it fills parent */
}

/* Sidebar */
.sidebar {
  width: 260px;
  background: white;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* Editor Pane */
.editor-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
