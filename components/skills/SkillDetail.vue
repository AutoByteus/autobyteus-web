<template>
  <div v-if="!skill" class="loading">Loading skill...</div>
  <div v-else class="skill-detail">
    <!-- Header -->
    <div class="skill-header">
      <button class="btn-back" @click="$emit('back')">← Back to Skills</button>
      <div class="header-content">
        <h2>{{ skill.name }}</h2>
        <p class="description">{{ skill.description }}</p>
      </div>
    </div>

    <!-- Two-panel layout -->
    <div class="skill-panels">
      <!-- Left: File Tree -->
      <div class="file-tree-panel">
        <div class="panel-header">
          <h3>📁 Files ({{ skill.fileCount }})</h3>
          <button class="btn-add" @click="showUploadDialog = true">+ Add</button>
        </div>
        
        <div v-if="fileTreeData" class="tree-container">
          <SkillFileTreeItem 
            :node="fileTreeData" 
            :skill-name="skill.name"
            @selectFile="handleSelectFile"
          />
        </div>
        <div v-else class="empty">No files</div>
      </div>

      <!-- Right: Content Viewer -->
      <div class="content-panel">
        <div class="panel-header">
          <h3>{{ selectedFile || 'SKILL.md' }}</h3>
          <div class="header-actions" v-if="selectedFile">
            <button v-if="!isEditing" class="btn-edit" @click="startEdit">✏️ Edit</button>
            <button v-if="!isEditing" class="btn-delete-file" @click="confirmDeleteFile">🗑️ Delete</button>
            <template v-if="isEditing">
              <button class="btn-cancel" @click="cancelEdit">Cancel</button>
              <button class="btn-save" @click="saveEdit">💾 Save</button>
            </template>
          </div>
        </div>
        
        <div v-if="loadingContent" class="loading-content">Loading...</div>
        <div v-else-if="fileContent" class="content-viewer">
          <!-- Edit mode: textarea -->
          <textarea
            v-if="isEditing"
            v-model="editContent"
            class="edit-textarea"
            @input="autoResize"
            ref="editTextarea"
          ></textarea>
          <!-- View mode: pre -->
          <pre v-else><code>{{ fileContent }}</code></pre>
        </div>
        <div v-else class="empty-content">
          <p>Select a file from the tree to view its content</p>
        </div>
      </div>
    </div>

    <!-- Upload Dialog -->
    <div v-if="showUploadDialog" class="dialog-overlay" @click="showUploadDialog = false">
      <div class="dialog" @click.stop>
        <h3>Add File</h3>
        <div class="form-group">
          <label>File Path:</label>
          <input v-model="newFile.path" type="text" placeholder="e.g., scripts/run.sh" />
        </div>
        <div class="form-group">
          <label>Content:</label>
          <textarea v-model="newFile.content" rows="15"></textarea>
        </div>
        <div class="dialog-actions">
          <button @click="showUploadDialog = false">Cancel</button>
          <button class="btn-primary" @click="handleUploadFile">Upload</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useSkillStore } from '~/stores/skillStore'
import { storeToRefs } from 'pinia'
import type { Skill } from '~/types/skill'
import SkillFileTreeItem from './SkillFileTreeItem.vue'

const props = defineProps<{
  skillName: string
}>()

const emit = defineEmits<{
  back: []
}>()

const skillStore = useSkillStore()
const { currentSkill, currentSkillTree } = storeToRefs(skillStore)

const skill = ref<Skill | null>(null)
const fileTreeData = ref<any>(null)
const selectedFile = ref<string>('SKILL.md')
const fileContent = ref<string>('')
const loadingContent = ref(false)
const showUploadDialog = ref(false)
const isEditing = ref(false)
const editContent = ref<string>('')
const editTextarea = ref<HTMLTextAreaElement | null>(null)
const newFile = ref({
  path: '',
  content: '',
})

onMounted(async () => {
  await loadSkillDetails()
  // Auto-load SKILL.md content
  await loadFileContent('SKILL.md')
})

watch(() => props.skillName, async () => {
  await loadSkillDetails()
  await loadFileContent('SKILL.md')
})

async function loadSkillDetails() {
  skill.value = await skillStore.fetchSkill(props.skillName)
  await skillStore.fetchSkillFileTree(props.skillName)
  
  // Parse JSON tree
  if (currentSkillTree.value) {
    try {
      fileTreeData.value = JSON.parse(currentSkillTree.value)
    } catch (e) {
      console.error('Failed to parse file tree:', e)
    }
  }
}

async function handleSelectFile(filePath: string) {
  // Cancel any pending edits
  isEditing.value = false
  selectedFile.value = filePath
  await loadFileContent(filePath)
}

async function loadFileContent(filePath: string) {
  if (!skill.value) return
  
  loadingContent.value = true
  try {
    const content = await skillStore.readFileContent(skill.value.name, filePath)
    fileContent.value = content || 'File content not available'
  } catch (e) {
    console.error('Failed to load file content:', e)
    fileContent.value = 'Error loading file content'
  } finally {
    loadingContent.value = false
  }
}

function startEdit() {
  isEditing.value = true
  editContent.value = fileContent.value
  nextTick(() => {
    if (editTextarea.value) {
      autoResize()
      editTextarea.value.focus()
    }
  })
}

function cancelEdit() {
  isEditing.value = false
  editContent.value = ''
}

async function saveEdit() {
  if (!skill.value || !selectedFile.value) return
  
  try {
    await skillStore.uploadFile(skill.value.name, selectedFile.value, editContent.value)
    fileContent.value = editContent.value
    isEditing.value = false
    // Reload skill details to update file count if needed
    await loadSkillDetails()
  } catch (e) {
    console.error('Failed to save file:', e)
    alert('Failed to save file')
  }
}

async function confirmDeleteFile() {
  if (!skill.value || !selectedFile.value) return
  
  if (confirm(`Delete file "${selectedFile.value}"?`)) {
    try {
      await skillStore.deleteFile(skill.value.name, selectedFile.value)
      // Reset selection and reload
      selectedFile.value = 'SKILL.md'
      fileContent.value = ''
      await loadSkillDetails()
      await loadFileContent('SKILL.md')
    } catch (e) {
      console.error('Failed to delete file:', e)
      alert('Failed to delete file')
    }
  }
}

function autoResize() {
  const textarea = editTextarea.value
  if (textarea) {
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }
}

async function handleUploadFile() {
  if (!skill.value || !newFile.value.path) return
  
  try {
    await skillStore.uploadFile(skill.value.name, newFile.value.path, newFile.value.content)
    showUploadDialog.value = false
    newFile.value = { path: '', content: '' }
    await loadSkillDetails()
  } catch (e) {
    console.error('Failed to upload file:', e)
    alert('Failed to upload file')
  }
}
</script>

<style scoped>
.skill-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.skill-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.btn-back {
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  transition: background 0.2s;
}

.btn-back:hover {
  background: #e5e7eb;
}

.header-content h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.875rem;
  font-weight: 600;
  color: #111827;
}

.description {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
}

.skill-panels {
  display: grid;
  grid-template-columns: 320px 1fr;
  flex: 1;
  overflow: hidden;
}

.file-tree-panel,
.content-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.file-tree-panel {
  border-right: 1px solid #e5e7eb;
  background: #f9fafb;
}

.panel-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
}

.panel-header h3 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-edit,
.btn-delete-file,
.btn-save,
.btn-cancel {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-edit {
  background: #3b82f6;
  color: white;
}

.btn-edit:hover {
  background: #2563eb;
}

.btn-delete-file {
  background: #ef4444;
  color: white;
}

.btn-delete-file:hover {
  background: #dc2626;
}

.btn-save {
  background: #10b981;
  color: white;
}

.btn-save:hover {
  background: #059669;
}

.btn-cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-add {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.375rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
}

.btn-add:hover {
  background: #2563eb;
}

.tree-container {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.content-panel {
  background: white;
}

.content-viewer {
  flex: 1;
  overflow: auto;
  padding: 1.5rem;
}

.content-viewer pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.content-viewer code {
  color: #1f2937;
}

.edit-textarea {
  width: 100%;
  min-height: 400px;
  padding: 1.5rem;
  border: 2px solid #3b82f6;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  resize: vertical;
  outline: none;
}

.edit-textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.loading,
.loading-content,
.empty,
.empty-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 0.875rem;
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
  font-size: 0.875rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
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
