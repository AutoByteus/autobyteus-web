<template>
  <div class="skill-card">
    <div class="skill-icon">📁</div>
    <div class="skill-content">
      <h3 class="skill-name">{{ skill.name }}</h3>
      <p class="skill-description">{{ skill.description }}</p>
      <div class="skill-meta">
        <span class="file-count">📄 {{ skill.fileCount }} files</span>
      </div>
    </div>
    <div class="skill-actions">
      <button class="btn-view" @click="$emit('view', skill)">View</button>
      <button class="btn-delete" @click="$emit('delete', skill)">Delete</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Skill } from '~/types/skill'

defineProps<{
  skill: Skill
}>()

defineEmits<{
  view: [skill: Skill]
  delete: [skill: Skill]
}>()
</script>

<style scoped>
.skill-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.2s;
}

.skill-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.skill-icon {
  font-size: 2rem;
}

.skill-content {
  flex: 1;
}

.skill-name {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #1f2937;
}

.skill-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
}

.skill-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: #9ca3af;
}

.skill-actions {
  display: flex;
  gap: 0.5rem;
}

.skill-actions button {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-view {
  background: #3b82f6;
  color: white;
}

.btn-view:hover {
  background: #2563eb;
}

.btn-delete {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-delete:hover {
  background: #ef4444;
  color: white;
}
</style>
