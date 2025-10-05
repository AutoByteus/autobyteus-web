<template>
  <div class="p-6 h-full flex flex-col bg-gray-50 border-l border-gray-200">
    <h2 class="text-xl font-semibold text-gray-800 mb-4 flex-shrink-0">Solution & Animation</h2>
    
    <div v-if="isLoading" class="flex-1 flex flex-col items-center justify-center text-gray-600">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p class="mt-4 font-semibold">Generating solution and animation...</p>
        <p class="text-sm text-gray-500 mt-1">This may take a moment.</p>
    </div>

    <div v-else-if="error" class="flex-1 flex flex-col items-center justify-center bg-red-50 p-4 rounded-md">
      <span class="i-heroicons-exclamation-triangle-20-solid w-12 h-12 text-red-500"></span>
      <h3 class="mt-2 text-lg font-bold text-red-800">An Error Occurred</h3>
      <p class="mt-1 text-sm text-red-700 text-center">{{ error }}</p>
    </div>

    <div v-else-if="!solutionText && !animationUrl" class="flex-1 flex flex-col items-center justify-center text-gray-500">
      <span class="i-heroicons-sparkles-20-solid w-12 h-12 text-gray-400"></span>
      <h3 class="mt-2 text-lg font-medium">Ready to Solve</h3>
      <p class="mt-1 text-sm text-center">Enter a problem and click "Solve & Animate" to see the magic happen.</p>
    </div>

    <div v-else class="flex-1 grid grid-rows-2 gap-4 overflow-hidden">
      <div class="bg-white p-4 border border-gray-200 rounded-md overflow-y-auto">
        <h3 class="font-bold text-gray-800 mb-2">Step-by-Step Solution:</h3>
        <pre class="whitespace-pre-wrap font-sans text-sm text-gray-700">{{ solutionText }}</pre>
      </div>
      <div class="bg-white border border-gray-200 rounded-md overflow-hidden relative">
        <iframe v-if="animationUrl" :src="animationUrl" class="w-full h-full border-0" sandbox="allow-scripts allow-same-origin"></iframe>
        <div v-else class="w-full h-full flex items-center justify-center text-gray-500">
          <p>Animation will appear here.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isLoading: boolean;
  error: string | null;
  solutionText: string | null;
  animationUrl: string | null;
}>();
</script>
