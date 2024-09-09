<template>
  <div 
    class="px-3 py-2 cursor-pointer border border-gray-300 mr-1 border-b-0 transition-colors duration-200 ease-in-out"
    :class="{ 'bg-white border-t-4 border-t-blue-500': isActive, 'hover:bg-gray-100': !isActive }"
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