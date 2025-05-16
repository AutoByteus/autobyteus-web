<template>
  <div 
    class="px-3 py-1 cursor-pointer border border-gray-300 mr-1 border-b-0 rounded-t-md transition-colors duration-200 ease-in-out"
    :class="{ 
      'bg-white text-blue-600': isActive, 
      'bg-gray-100 text-gray-700 hover:bg-gray-200': !isActive 
    }"
    @click="selectTab"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
  name: String,
  selected: Boolean,
});

const isActive = computed(() => props.selected);

const emit = defineEmits(["select"]);

const selectTab = () => {
  emit("select", props.name);
};
</script>
