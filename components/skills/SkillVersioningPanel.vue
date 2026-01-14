<template>
  <div class="versioning-panel">
    <div class="panel-header">
      <div>
        <h3 class="panel-title">Versioning</h3>
        <p class="panel-subtitle">Manage skill versions and compare changes.</p>
      </div>
      <div v-if="skill.isVersioned" class="active-badge">
        Active: {{ skill.activeVersion || 'Unknown' }}
      </div>
    </div>

    <div v-if="!skill.isVersioned" class="panel-body">
      <div class="status-row">
        <span class="status-dot status-dot--inactive"></span>
        <span class="status-text">Not versioned</span>
      </div>
      <button class="btn-primary" :disabled="skill.isReadonly || actionLoading" @click="$emit('enable-versioning')">
        Enable Versioning
      </button>
      <p v-if="skill.isReadonly" class="hint-text">This skill is read-only.</p>
      <p v-if="actionError" class="error-text">{{ actionError }}</p>
    </div>

    <div v-else class="panel-body">
      <div class="status-row">
        <span class="status-dot status-dot--active"></span>
        <span class="status-text">Versioned</span>
      </div>

      <div class="controls-row">
        <label class="control-label">Activate version</label>
        <div class="control-group">
          <select
            v-model="selectedVersion"
            class="version-select"
            :disabled="versionsLoading || versions.length === 0"
          >
            <option v-if="versions.length === 0" disabled value="">
              No versions available
            </option>
            <option
              v-for="version in versions"
              :key="version.tag"
              :value="version.tag"
            >
              {{ version.tag }}
            </option>
          </select>
          <button
            class="btn-secondary"
            :disabled="!canActivate || actionLoading || skill.isReadonly"
            @click="activateSelected"
          >
            Activate
          </button>
        </div>
        <p v-if="versionsLoading" class="hint-text">Loading versions…</p>
        <p v-else-if="versionsError" class="error-text">{{ versionsError }}</p>
        <p v-else-if="skill.isReadonly" class="hint-text">This skill is read-only.</p>
        <p v-if="actionError" class="error-text">{{ actionError }}</p>
      </div>

      <div class="actions-row">
        <button class="btn-outline" :disabled="versions.length < 2" @click="$emit('compare-versions')">
          Compare Versions
        </button>
        <span v-if="versions.length < 2" class="hint-text">Need at least two versions to compare.</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Skill, SkillVersion } from '~/types/skill'

const props = defineProps<{
  skill: Skill
  versions: SkillVersion[]
  versionsLoading: boolean
  versionsError: string
  actionError: string
  actionLoading: boolean
}>()

const emit = defineEmits<{
  'enable-versioning': []
  'activate-version': [version: string]
  'compare-versions': []
}>()

const selectedVersion = ref('')

const canActivate = computed(() => {
  if (!props.skill.isVersioned) return false
  if (!selectedVersion.value) return false
  return selectedVersion.value !== props.skill.activeVersion
})

function selectDefaultVersion() {
  if (props.skill.activeVersion) {
    selectedVersion.value = props.skill.activeVersion
    return
  }
  if (props.versions.length > 0) {
    selectedVersion.value = props.versions[0].tag
  }
}

function activateSelected() {
  if (!canActivate.value) return
  emit('activate-version', selectedVersion.value)
}

watch(
  () => [props.skill.activeVersion, props.versions],
  () => {
    if (!selectedVersion.value || selectedVersion.value === props.skill.activeVersion) {
      selectDefaultVersion()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.versioning-panel {
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 1.5rem 2rem;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.panel-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.panel-subtitle {
  margin: 0.25rem 0 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.active-badge {
  background: #111827;
  color: #f9fafb;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
}

.status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
}

.status-dot--inactive {
  background: #9ca3af;
}

.status-dot--active {
  background: #10b981;
}

.controls-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #6b7280;
  font-weight: 600;
}

.control-group {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.version-select {
  flex: 0 0 200px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
}

.actions-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-primary {
  align-self: flex-start;
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #111827;
  color: white;
  border: none;
  padding: 0.45rem 0.9rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-outline {
  background: white;
  color: #111827;
  border: 1px solid #d1d5db;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hint-text {
  font-size: 0.8125rem;
  color: #6b7280;
}

.error-text {
  font-size: 0.8125rem;
  color: #dc2626;
}
</style>
