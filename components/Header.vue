<template>
  <header class="bg-gray-800 text-white shadow-md">
    <div class="container mx-auto px-4 py-3 flex justify-between items-center">
      <h1 class="text-2xl font-bold">AI Code Automation</h1>
      <div class="flex items-center space-x-4">
        <nav>
          <ul class="flex space-x-4">
            <li><NuxtLink to="/" class="hover:text-blue-300 transition-colors duration-200 px-3 py-2 rounded-md text-sm font-medium">Home</NuxtLink></li>
          </ul>
        </nav>
        <button 
          @click="toggleAPIKeyManager"
          class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
        >
          Manage API Keys
        </button>
      </div>
    </div>
    <Modal v-if="showAPIKeyManager" @close="toggleAPIKeyManager">
      <APIKeyManager />
    </Modal>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import APIKeyManager from '~/components/APIKeyManager.vue'
import Modal from '~/components/ui/Modal.vue'

const showAPIKeyManager = ref(false)

const toggleAPIKeyManager = () => {
  showAPIKeyManager.value = !showAPIKeyManager.value
  console.log('API Key Manager visibility:', showAPIKeyManager.value)
}
</script>
