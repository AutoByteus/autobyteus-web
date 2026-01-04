<template>
  <div class="flex flex-col h-full bg-white">
    <!-- Header / List (Split View or List Item) -->
    <!-- For simplicity, let's list artifacts at top and show active one below, or a side-by-side -->
    <!-- Given component width is small (right sidebar), a list that toggles detail is better -->
    
    <div v-if="!selectedArtifact" class="flex-1 overflow-y-auto">
      <div v-if="artifacts.length === 0" class="p-4 text-center text-gray-400">
        No artifacts created yet.
      </div>
      <div v-else class="divide-y divide-gray-100">
        <div 
          v-for="artifact in artifacts" 
          :key="artifact.id"
          @click="selectArtifact(artifact)"
          class="p-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between group transition-colors"
        >
          <div class="flex items-center gap-3 overflow-hidden">
             <!-- Icon based on status/type -->
             <Icon :icon="getStatusIcon(artifact.status).name" :class="getStatusIcon(artifact.status).class" class="w-4 h-4 flex-shrink-0" />
             
             <div class="flex flex-col min-w-0">
               <span class="text-sm font-medium text-gray-700 truncate">{{ getFileName(artifact.path) }}</span>
               <span class="text-xs text-gray-500 truncate">{{ artifact.path }}</span>
             </div>
          </div>
          
          <!-- Optional: Still showing file type icon or similar could be nice, but for now simple list -->
        </div>
      </div>
    </div>

    <!-- Detail View (Viewer) -->
    <div v-else class="flex-1 flex flex-col h-full relative">
       <!-- Back Button Header -->
       <div class="flex items-center gap-2 p-2 border-b border-gray-200 bg-gray-50">
         <button 
           @click="selectedArtifact = null"
           class="p-1 hover:bg-gray-200 rounded text-gray-600"
           title="Back to List"
         >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
             <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
           </svg>
         </button>
         <div class="text-sm font-medium text-gray-800 truncate">{{ getFileName(selectedArtifact.path) }}</div>
         
         <div class="ml-auto" :title="selectedArtifact.status"> <!-- Added tooltip for clarity -->
            <Icon :icon="getStatusIcon(selectedArtifact.status).name" :class="getStatusIcon(selectedArtifact.status).class" class="w-5 h-5" />
         </div>
       </div>

       <!-- Content Viewer -->
       <div class="flex-1 overflow-hidden relative">
          <!-- We reuse FileContentViewer logic but we might need to mock the props since FileContentViewer is tightly coupled to FileExplorerStore -->
          <!-- Actually, FileContentViewer uses store data. We should probably create a simpler 'ArtifactViewer' or adapt FileContentViewer. -->
          <!-- For speed/consistency, let's use a specialized Monaco instance for text artifacts -->
          
          <MonacoEditor
             v-if="selectedArtifact.type === 'file'"
             :model-value="selectedArtifact.content || ''"
             :language="getLanguage(selectedArtifact.path)"
             :read-only="isReadOnly(selectedArtifact)"
             class="w-full h-full"
          />
          <div v-else class="flex items-center justify-center h-full text-gray-400">
             Media preview not implemented yet.
          </div>
       </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAgentArtifactsStore, type AgentArtifact } from '~/stores/agentArtifactsStore';
import { useAgentContextsStore } from '~/stores/agentContextsStore';
import MonacoEditor from '~/components/fileExplorer/MonacoEditor.vue';
import { getLanguage } from '~/utils/highlighting/languageDetector';
import { Icon } from '@iconify/vue';

const artifactsStore = useAgentArtifactsStore();
const agentContextsStore = useAgentContextsStore();

const currentAgentId = computed(() => agentContextsStore.selectedAgentId || "");
const artifacts = computed(() => artifactsStore.getArtifactsForAgent(currentAgentId.value));
const activeStream = computed(() => artifactsStore.getActiveStreamingArtifact(currentAgentId.value));

const selectedArtifact = ref<AgentArtifact | null>(null);

// Auto-select streaming artifact
watch(activeStream, (newArtifact) => {
  if (newArtifact) {
    selectedArtifact.value = newArtifact;
  }
}, { immediate: true });

const selectArtifact = (artifact: AgentArtifact) => {
  selectedArtifact.value = artifact;
};

const getFileName = (path: string) => path.split('/').pop() || path;

// Replace getStatusColor with icon mapping
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'streaming': return { name: 'svg-spinners:ring-resize', class: 'text-blue-500' };
    case 'pending_approval': return { name: 'heroicons:hand-raised-solid', class: 'text-yellow-500' };
    case 'persisted': return { name: 'heroicons:check-circle-solid', class: 'text-green-500' };
    case 'failed': return { name: 'heroicons:exclamation-circle-solid', class: 'text-red-500' };
    default: return { name: 'heroicons:question-mark-circle', class: 'text-gray-400' };
  }
};

const isReadOnly = (artifact: AgentArtifact) => {
   return artifact.status === 'streaming' || artifact.status === 'pending_approval';
};

</script>
