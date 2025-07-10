<template>
  <div class="w-72 bg-white shadow-sm overflow-y-auto h-full border-r border-gray-200">
    <div class="p-6">
      <h2 class="text-xl font-semibold text-gray-800 mb-6">Tools</h2>
      
      <nav class="w-full">
        <ul class="w-full space-y-2">
          <!-- Local Tools navigation item -->
          <li class="w-full">
            <button 
              @click="$emit('navigate', 'local-tools')"
              class="flex w-full items-center justify-start px-4 py-2 rounded-md transition-colors duration-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
              :class="{ 'bg-indigo-100 text-indigo-700 font-semibold': activePage === 'local-tools' }"
            >
              <span class="i-heroicons-cube-20-solid w-5 h-5 mr-3"></span>
              <span class="text-left">Local Tools</span>
            </button>
          </li>
          
          <!-- Remote Tools navigation item -->
          <li class="w-full">
            <button 
              @click="$emit('navigate', 'mcp-servers')"
              class="flex w-full items-center justify-start px-4 py-2 rounded-md transition-colors duration-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
              :class="{ 'bg-indigo-100 text-indigo-700 font-semibold': activePage.startsWith('mcp-') }"
            >
              <span class="i-heroicons-server-20-solid w-5 h-5 mr-3"></span>
              <span class="text-left">Mcp Servers</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  activePage: {
    type: String,
    required: true
  }
});

defineEmits(['navigate']);
</script>
