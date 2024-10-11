<template>
  <div class="flex h-full" @mousemove="onMouseMove" @mouseup="onMouseUp" @mouseleave="onMouseUp">
    <Panel
      v-for="(panel, index) in panels"
      :key="panel.id"
      :width="panel.width"
      :is-last="index === panels.length - 1"
      @resize-start="startResize(index)"
    >
      <slot :name="`panel-${panel.id}`"></slot>
    </Panel>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Panel from './Panel.vue';

const props = defineProps({
  initialLayout: {
    type: Array,
    required: true
  }
});

const panels = ref(props.initialLayout);
const resizingIndex = ref(-1);
const startX = ref(0);
const startWidths = ref([]);

onMounted(() => {
  normalizeWidths();
});

const normalizeWidths = () => {
  const totalWidth = panels.value.reduce((sum, panel) => sum + panel.width, 0);
  panels.value = panels.value.map(panel => ({
    ...panel,
    width: (panel.width / totalWidth) * 100
  }));
};

const startResize = (index: number) => {
  resizingIndex.value = index;
  startX.value = 0;
  startWidths.value = panels.value.map(panel => panel.width);
};

const onMouseMove = (e: MouseEvent) => {
  if (resizingIndex.value === -1) return;
  
  const dx = (e.clientX - startX.value) / window.innerWidth * 100;
  const newWidths = [...startWidths.value];
  newWidths[resizingIndex.value] += dx;
  newWidths[resizingIndex.value + 1] -= dx;

  // Ensure minimum width of 10% for each panel
  if (newWidths[resizingIndex.value] >= 10 && newWidths[resizingIndex.value + 1] >= 10) {
    panels.value = panels.value.map((panel, index) => ({
      ...panel,
      width: newWidths[index] || panel.width
    }));
  }
};

const onMouseUp = () => {
  resizingIndex.value = -1;
};
</script>