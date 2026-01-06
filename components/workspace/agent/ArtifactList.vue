<template>
  <div class="flex flex-col h-full bg-white overflow-hidden">
    <!-- Empty State -->
    <div v-if="isEmpty" class="flex flex-col items-center justify-center flex-1 p-6 text-center text-gray-400">
      <Icon icon="heroicons:document-plus" class="w-10 h-10 mb-2 text-gray-300" />
      <p class="text-sm">No artifacts created yet.</p>
    </div>

    <!-- Grouped Lists -->
    <div v-else class="flex-1 overflow-y-auto py-4">
      <!-- Media Section -->
      <div v-if="mediaArtifacts.length > 0" class="mb-6">
        <div class="px-4 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            Media
        </div>
        <ArtifactItem 
            v-for="artifact in mediaArtifacts" 
            :key="artifact.id" 
            :artifact="artifact"
            :is-selected="artifact.id === selectedArtifactId"
            @select="$emit('select', artifact)"
        />
      </div>

      <!-- Files Section -->
      <div v-if="fileArtifacts.length > 0">
         <div class="px-4 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest" :class="{ 'mt-2': mediaArtifacts.length > 0 }">
            Files
        </div>
        <ArtifactItem 
            v-for="artifact in fileArtifacts" 
            :key="artifact.id" 
            :artifact="artifact"
            :is-selected="artifact.id === selectedArtifactId"
            @select="$emit('select', artifact)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import type { AgentArtifact } from '~/stores/agentArtifactsStore';
import { determineFileType } from '~/utils/fileExplorer/fileUtils';
import ArtifactItem from './ArtifactItem.vue';

const props = defineProps<{
  artifacts: AgentArtifact[];
  selectedArtifactId?: string;
}>();

defineEmits(['select']);

const isEmpty = computed(() => props.artifacts.length === 0);

// Using determineFileType logic to categorize
// Since determineFileType is async (though currently implementation is sync-ish but typed as Promise),
// we might want a synchronous check or just do simple extension check here for UI grouping to avoid async complexity in computed.
// Let's reimplement simplest extension check here for grouping to ensure instant rendering.
// The actual Viewer will use the robust check.

const isMedia = (path: string) => {
    const lower = path.toLowerCase();
    const mediaExts = [
        // Images
        '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg',
        // Audio
        '.mp3', '.wav', '.m4a', '.flac', '.ogg',
        // Video
        '.mp4', '.mov', '.avi', '.mkv', '.webm'
    ];
    return mediaExts.some(ext => lower.endsWith(ext));
};

const mediaArtifacts = computed(() => props.artifacts.filter(a => isMedia(a.path)));
const fileArtifacts = computed(() => props.artifacts.filter(a => !isMedia(a.path)));

</script>
