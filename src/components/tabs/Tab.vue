<template>
  <div class="tab" :class="{ active: isActive }" @click="selectTab">
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

<style scoped>
.tab {
  padding: 10px;
  cursor: pointer;
  border: 1px solid #ddd;
  margin-right: 5px;
  border-bottom: none;
}

.tab.active {
  background-color: white;
  border-top: 3px solid #2d98da;
}
</style>
