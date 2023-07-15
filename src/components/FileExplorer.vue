<template>
    <div id="fileExplorer">
        <h2>Files</h2>
        <a href="#" v-for="file in files" :key="file" @click.prevent="selectFile(file)">
            {{ file }}
        </a>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// Dummy file data, this should be fetched based on selected workspace in a real app
const files = ref(['File 1', 'File 2']);
const selectFile = (file: string) => {
    // Logic to handle file selection
    // The selected file can be stored in a shared state like Vuex or provide/inject API
};

</script>
