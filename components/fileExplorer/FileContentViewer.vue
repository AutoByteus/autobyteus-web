<template>
    <div id="contentViewer">
        <h2>Contents</h2>
        <div>{{ content }}</div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// Dummy content data, this should be fetched based on selected file in a real app
const content = ref('File contents here...');

</script>
