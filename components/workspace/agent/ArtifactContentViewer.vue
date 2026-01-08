<template>
  <div class="h-full flex flex-col bg-white">
    <!-- Header / Meta Info -->
    <div v-if="artifact" class="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0 min-h-[45px]">
         <!-- Breadcrumb style path display -->
         <div class="flex items-center text-sm text-gray-600 space-x-1">
             <!-- Root/Workspace Icon -->
             <Icon icon="heroicons:folder-open" class="w-4 h-4 text-gray-400" />
             <!-- Separator -->
             <span class="text-gray-300">/</span>
             <!-- Path -->
             <span class="font-medium text-gray-800">{{ artifact.path }}</span>
         </div>
    </div>

    <!-- Empty State -->
    <div v-if="!artifact" class="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
         <Icon icon="heroicons:cursor-arrow-rays" class="w-16 h-16 mb-4 text-gray-300" />
         <h3 class="text-lg font-medium text-gray-500 mb-1">No artifact selected</h3>
         <p class="text-sm">Select an artifact to view its content.</p>
    </div>

    <div v-else class="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <div v-if="loading" class="flex-1 flex items-center justify-center text-gray-400">
            Loading content...
        </div>
        
        <component
            v-else-if="activeComponent"
            :is="activeComponent"
            v-bind="componentProps"
            class="h-full w-full"
        />
        
        <div v-else class="flex-1 flex items-center justify-center text-gray-400">
            Preview not available for this file type.
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import type { AgentArtifact } from '~/stores/agentArtifactsStore';
import { determineFileType } from '~/utils/fileExplorer/fileUtils';
import { getLanguage } from '~/utils/highlighting/languageDetector';

// Import Viewers
import MonacoEditor from '~/components/fileExplorer/MonacoEditor.vue';
import ImageViewer from '~/components/fileExplorer/viewers/ImageViewer.vue';
import AudioPlayer from '~/components/fileExplorer/viewers/AudioPlayer.vue';
import VideoPlayer from '~/components/fileExplorer/viewers/VideoPlayer.vue';
import PdfViewer from '~/components/fileExplorer/viewers/PdfViewer.vue';
import ExcelViewer from '~/components/fileExplorer/viewers/ExcelViewer.vue';

const props = defineProps<{
  artifact: AgentArtifact | null;
}>();

const fileType = ref<'Text' | 'Image' | 'Audio' | 'Video' | 'Excel' | 'PDF'>('Text');
const loading = ref(false);

const updateFileType = async () => {
    if (!props.artifact) return;
    loading.value = true;
    try {
        fileType.value = await determineFileType(props.artifact.path);
    } finally {
        loading.value = false;
    }
};

watch(() => props.artifact, updateFileType, { immediate: true });

const activeComponent = computed(() => {
    switch (fileType.value) {
        case 'Text': return MonacoEditor;
        case 'Image': return ImageViewer;
        case 'Audio': return AudioPlayer;
        case 'Video': return VideoPlayer;
        case 'PDF': return PdfViewer;
        case 'Excel': return ExcelViewer; 
        default: return MonacoEditor; // Fallback to text for unknown
    }
});

const componentProps = computed(() => {
    if (!props.artifact) return {};
    
    if (fileType.value === 'Text') {
        return {
            modelValue: props.artifact.content || '',
            language: getLanguage(props.artifact.path),
            readOnly: true, // Artifacts are generally read-only in this view
        };
    }
    
    // Media, PDF, Excel props
    // Most viewers just take 'url'
    return {
        url: props.artifact.url || '', 
    };
});

</script>
