<template>
    <div id="contentViewer" class="bg-white rounded-lg shadow-md p-4">
      <div class="flex border-b mb-4">
        <button class="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-tl-lg">File</button>
        <button class="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">Agent</button>
      </div>
      <h2 class="text-lg font-semibold mb-2 text-gray-700">Contents</h2>
      <div class="bg-gray-50 p-4 rounded-lg text-gray-600">{{ content }}</div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  
  // Dummy content data, this should be fetched based on selected file in a real app
  const content = ref('File contents here...');
  </script>