<template>
  <div class="flex h-full bg-gray-100">
    <!-- Sidebar -->
    <div class="w-64 bg-white shadow-sm">
      <div class="p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-6">Tools</h2>
        <nav class="w-full">
          <ul class="w-full space-y-2">
            <li class="w-full">
              <button 
                @click="activeSection = 'token-counter'"
                class="flex w-full items-center justify-start px-4 py-2 rounded-md transition-colors duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900 group"
                :class="{ 'bg-gray-100 text-gray-900': activeSection === 'token-counter' }"
              >
                <div class="flex items-center min-w-[20px] mr-3">
                  <span class="i-heroicons-calculator-20-solid w-5 h-5"></span>
                </div>
                <span class="text-left">Token Counter</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Content section -->
    <div class="flex-1 overflow-auto">
      <div class="max-w-7xl mx-auto p-6">
        <TokenCounter v-if="activeSection === 'token-counter'" />
        <div v-else class="text-center text-gray-500 mt-12">
          <span class="i-heroicons-wrench-screwdriver-20-solid w-12 h-12 mx-auto mb-4"></span>
          <h3 class="text-xl font-medium mb-2">Tools</h3>
          <p>Select a tool from the sidebar to get started.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TokenCounter from '~/components/tools/TokenCounter.vue';
const activeSection = ref('token-counter');
</script>
