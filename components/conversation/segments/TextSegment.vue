<template>
  <div class="mb-4 break-words" v-html="formattedText"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  content: string;
}>();

const formattedText = computed(() => {
  return props.content.replace(/\n/g, '<br>');
});
</script>