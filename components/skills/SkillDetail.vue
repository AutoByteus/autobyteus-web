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
    <div class="workspace">
      <!-- Left: File Sidebar -->
      <div class="sidebar">
        <div class="sidebar-header">
          <h3>Files</h3>
          <button v-if="!skill.isReadonly" class="btn-icon-sm" @click="showUploadDialog = true" title="Add File">
            <Icon icon="heroicons:plus" />
          </button>
        </div>
        
        <div v-if="fileTreeData" class="file-tree">
          <SkillFileTreeItem 
            :node="fileTreeData" 
            :skill-name="skill.name"
            :selected-path="selectedFile"
            @selectFile="handleSelectFile"
          />
        </div>
        <div v-else class="empty-sidebar">
          <p>No files</p>
        </div>
      </div>

      <!-- Right: Editor/Viewer -->
      <div class="editor-pane">
        <div class="editor-toolbar">
          <div class="file-info">
            <span class="file-name">{{ selectedFile || 'Select a file' }}</span>
          </div>
          
          <div class="toolbar-actions" v-if="selectedFile">
            <template v-if="!isEditing && !skill.isReadonly">
              <button class="btn-text" @click="startEdit">Edit</button>
              <button class="btn-text danger" @click="confirmDeleteFile">Delete</button>
            </template>
            
            <template v-else-if="isEditing">
              <button class="btn-secondary" @click="cancelEdit">Cancel</button>
              <button class="btn-primary" @click="saveEdit">Save</button>
            </template>
          </div>
        </div>
        
        <div class="editor-content">
          <div v-if="loadingContent" class="loading-content">
            <div class="spinner"></div>
          </div>
          
          <div v-else-if="fileContent" class="content-wrapper">
            <textarea
              v-if="isEditing"
              v-model="editContent"
              class="code-editor"
              spellcheck="false"
              ref="editTextarea"
            ></textarea>
            <pre v-else class="code-viewer"><code>{{ fileContent }}</code></pre>
          </div>
          
          <div v-else class="empty-content">
            <p>Select a file to view content</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Dialog -->
    <div v-if="showUploadDialog" class="dialog-overlay" @click="showUploadDialog = false">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>Add New File</h3>
          <button class="btn-close" @click="showUploadDialog = false">
            <Icon icon="heroicons:x-mark" />
          </button>
        </div>
        
        <div class="dialog-body">
          <div class="form-group">
            <label>File Path</label>
            <input 
              v-model="newFile.path" 
              type="text" 
              placeholder="e.g., scripts/run.py" 
              autofocus
            />
          </div>
          <div class="form-group">
            <label>Content</label>
            <textarea 
              v-model="newFile.content" 
              rows="12"
              class="code-input"
              placeholder="# File content..."
            ></textarea>
          </div>
        </div>
        
        <div class="dialog-footer">
          <button class="btn-secondary" @click="showUploadDialog = false">Cancel</button>
          <button 
            class="btn-primary" 
            @click="handleUploadFile"
            :disabled="!newFile.path"
          >
            Create File
          </button>
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
import { Icon } from '@iconify/vue'

const props = defineProps<{
  skillName: string
}>()

const emit = defineEmits<{
  back: []
}>()

// Store and state initialization
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

// Lifecycle and Methods
onMounted(async () => {
  await loadSkillDetails()
  if (fileTreeData.value) {
    await loadFileContent('SKILL.md')
  }
})

watch(() => props.skillName, async () => {
  await loadSkillDetails()
  await loadFileContent('SKILL.md')
})

async function loadSkillDetails() {
  skill.value = await skillStore.fetchSkill(props.skillName)
  await skillStore.fetchSkillFileTree(props.skillName)
  
  if (currentSkillTree.value) {
    try {
      fileTreeData.value = JSON.parse(currentSkillTree.value)
    } catch (e) {
      console.error('Failed to parse file tree:', e)
    }
  }
}

async function handleSelectFile(filePath: string) {
  isEditing.value = false
  selectedFile.value = filePath
  await loadFileContent(filePath)
}

async function loadFileContent(filePath: string) {
  if (!skill.value) return
  loadingContent.value = true
  try {
    const content = await skillStore.readFileContent(skill.value.name, filePath)
    fileContent.value = content || ''
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
    editTextarea.value?.focus()
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
    await loadSkillDetails()
  } catch (e) {
    alert('Failed to save file: ' + e)
  }
}

async function confirmDeleteFile() {
  if (!skill.value || !selectedFile.value) return
  if (confirm(`Delete file "${selectedFile.value}"?`)) {
    try {
      await skillStore.deleteFile(skill.value.name, selectedFile.value)
      selectedFile.value = 'SKILL.md'
      fileContent.value = ''
      await loadSkillDetails()
      await loadFileContent('SKILL.md')
    } catch (e) {
      alert('Failed to delete file: ' + e)
    }
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
    alert('Failed to upload file: ' + e)
  }
}
</script>

<style scoped>
.skill-detail {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: white;
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
}

/* Sidebar */
.sidebar {
  width: 260px;
  background: white;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #9ca3af;
  letter-spacing: 0.05em;
}

.btn-icon-sm {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  display: flex;
}

.btn-icon-sm:hover {
  background: #e5e7eb;
  color: #111827;
}

.file-tree {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.empty-sidebar {
  padding: 2rem;
  text-align: center;
  color: #9ca3af;
  font-size: 0.875rem;
}

/* Editor Pane */
.editor-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  min-width: 0;
}

.editor-toolbar {
  padding: 0 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 3.5rem;
  background: white;
}

.file-name {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.toolbar-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-text {
  background: none;
  border: none;
  padding: 0.5rem;
  color: #3b82f6;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-text:hover {
  text-decoration: underline;
}

.btn-text.danger {
  color: #ef4444;
}

.btn-primary, .btn-secondary {
  border: none;
  padding: 0.375rem 0.875rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: white;
  border: 1px solid #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background: #f9fafb;
}

.editor-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.content-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.code-editor,
.code-viewer {
  flex: 1;
  padding: 1.5rem;
  margin: 0;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  border: none;
  resize: none;
  outline: none;
  background: white;
  color: #1f2937;
  white-space: pre-wrap;
  overflow: auto;
}

.code-editor {
  background: #fafafa;
}

.loading-content,
.empty-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 0.875rem;
}

/* Dialog */
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
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.dialog-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.dialog-body {
  padding: 1.5rem;
}

.dialog-footer {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  background: #f9fafb;
  border-radius: 0 0 12px 12px;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  color: #374151;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  font-size: 1.25rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
