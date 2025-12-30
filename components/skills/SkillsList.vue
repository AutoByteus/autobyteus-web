<template>
  <div class="skills-list">
    <div class="skills-header">
      <h2>Skills</h2>
      <button class="btn-create" @click="showCreateDialog = true">
        <span class="icon">+</span>
        Create New Skill
      </button>
    </div>

    <div v-if="loading" class="loading">Loading skills...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="skills.length === 0" class="empty-state">
      <p>No skills yet. Create your first skill to get started!</p>
    </div>
    <div v-else class="skills-grid">
      <SkillCard
        v-for="skill in skills"
        :key="skill.name"
        :skill="skill"
        @view="handleViewSkill"
        @delete="handleDeleteSkill"
      />
    </div>

    <!-- Simple create dialog (placeholder - full wizard to be implemented) -->
    <div v-if="showCreateDialog" class="dialog-overlay" @click="showCreateDialog = false">
      <div class="dialog" @click.stop>
        <h3>Create New Skill</h3>
        <div class="form-group">
          <label>Name:</label>
          <input v-model="newSkill.name" type="text" placeholder="e.g., java_expert" />
        </div>
        <div class="form-group">
          <label>Description:</label>
          <textarea v-model="newSkill.description" placeholder="Brief description"></textarea>
        </div>
        <div class="form-group">
          <label>Content:</label>
          <textarea v-model="newSkill.content" rows="10" placeholder="# Skill content..."></textarea>
        </div>
        <div class="dialog-actions">
          <button @click="showCreateDialog = false">Cancel</button>
          <button class="btn-primary" @click="handleCreateSkill">Create</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSkillStore } from '~/stores/skillStore'
import SkillCard from './SkillCard.vue'
import type { Skill } from '~/types/skill'

const emit = defineEmits<{
  viewDetail: [skillName: string]
}>()

const skillStore = useSkillStore()
const showCreateDialog = ref(false)
const newSkill = ref({
  name: '',
  description: '',
  content: '',
})

const { skills, loading, error } = storeToRefs(skillStore)

onMounted(async () => {
  await skillStore.fetchAllSkills()
})

async function handleCreateSkill() {
  try {
    await skillStore.createSkill({
      name: newSkill.value.name,
      description: newSkill.value.description,
      content: newSkill.value.content,
    })
    showCreateDialog.value = false
    newSkill.value = { name: '', description: '', content: '' }
  } catch (e) {
    console.error('Failed to create skill:', e)
  }
}

function handleViewSkill(skill: Skill) {
  skillStore.setCurrentSkill(skill)
  // Emit event to parent to show detail view
  emit('viewDetail', skill.name)
}

async function handleDeleteSkill(skill: Skill) {
  if (confirm(`Delete skill "${skill.name}"?`)) {
    try {
      await skillStore.deleteSkill(skill.name)
    } catch (e) {
      console.error('Failed to delete skill:', e)
    }
  }
}
</script>

<style scoped>
.skills-list {
  padding: 2rem;
}

.skills-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.skills-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.btn-create {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-create:hover {
  background: #2563eb;
}

.btn-create .icon {
  font-size: 1.25rem;
}

.loading,
.error,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.error {
  color: #ef4444;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* Dialog styles */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.dialog h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
}

.dialog-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.dialog-actions button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.dialog-actions button:first-child {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}
</style>
