<template>
  <div class="flex flex-col h-full">
    <div class="bg-gray-200 p-2 font-semibold">{{ title }}</div>
    <div class="flex-grow overflow-auto p-2">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    required: true
  }
});
</script>