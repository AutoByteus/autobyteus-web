<template>
    <div class="search-result">
        <span>{{ snippet }}</span>
        <button class="search-context-button">Select</button>
    </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

const props = defineProps<{ snippet: string }>();
const { snippet } = toRefs(props);
</script>

<style scoped>
    /* ... styles specific to SearchResult component ... */
</style>
