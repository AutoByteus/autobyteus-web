<template>
  <div class="flex items-center space-x-2" :title="`Team Phase: ${visuals.text}`">
    <div :class="['w-3 h-3 rounded-full transition-colors duration-300', visuals.colorClass]"></div>
    <span class="text-sm text-gray-600 font-medium">{{ visuals.text }}</span>
  </div>
</template>

<script setup lang="ts">
import { toRefs } from 'vue';
import { usePhaseVisuals } from '~/composables/usePhaseVisuals';

const props = defineProps<{  phase: string;
}>();

const { phase } = toRefs(props);
// Reusing the same visuals composable as single agents
const { visuals } = usePhaseVisuals(phase);
</script>
