<template>
  <header class="bg-gray-800 text-white shadow-md">
    <div class="container mx-auto px-4 py-3 flex justify-between items-center">
      <NuxtLink 
        to="/" 
        class="flex items-center gap-3 hover:opacity-90 transition-opacity duration-200"
        :aria-label="'Return to home page'"
      >
        <img 
          src="/autobyteus-icon.svg"
          alt="AutoByteus Icon" 
          class="w-7 h-7"
        />
        <h1 class="text-2xl font-bold tracking-tight">AutoByteus</h1>
      </NuxtLink>
      <div class="flex items-center space-x-6">
        <nav>
          <ul class="flex space-x-6">
            <li>
              <NuxtLink 
                to="/" 
                class="hover:text-blue-300 transition-colors duration-200 px-3 py-2 rounded-md text-sm font-medium relative group"
                :class="{'text-blue-300': $route.path === '/'}"
              >
                Home
                <span class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200" 
                      :class="{'scale-x-100': $route.path === '/'}">
                </span>
              </NuxtLink>
            </li>
            <li>
              <NuxtLink 
                to="/agents" 
                class="hover:text-blue-300 transition-colors duration-200 px-3 py-2 rounded-md text-sm font-medium relative group"
                :class="{'text-blue-300': $route.path === '/agents'}"
              >
                Agents
                <span class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200" 
                      :class="{'scale-x-100': $route.path === '/agents'}">
                </span>
              </NuxtLink>
            </li>
            <li>
              <NuxtLink 
                to="/prompt-engineering" 
                class="hover:text-blue-300 transition-colors duration-200 px-3 py-2 rounded-md text-sm font-medium relative group"
                :class="{'text-blue-300': $route.path === '/prompt-engineering'}"
              >
                Prompt Engineering
                <span class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"
                      :class="{'scale-x-100': $route.path === '/prompt-engineering'}">
                </span>
              </NuxtLink>
            </li>
          </ul>
        </nav>
        <button 
          @click="toggleAPIKeyManager"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
        >
          <span class="i-heroicons-key-20-solid w-4 h-4"></span>
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