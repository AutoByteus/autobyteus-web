<template>
  <div class="flex h-full bg-gray-100">
    <!-- Sidebar -->
    <div class="w-64 bg-white shadow-sm">
      <div class="p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-6">Settings</h2>
        <nav>
          <ul class="space-y-2">
            <li>
              <button 
                @click="activeSection = 'api-keys'"
                class="flex w-full items-center px-4 py-2 rounded-md transition-colors duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900 group relative"
                :class="{ 'bg-gray-100 text-gray-900': activeSection === 'api-keys' }"
              >
                <span class="i-heroicons-key-20-solid w-5 h-5 mr-3"></span>
                API Keys
                <span 
                  class="absolute left-0 w-1 h-8 bg-blue-600 rounded-r transform scale-y-0 transition-transform duration-200"
                  :class="{'scale-y-100': activeSection === 'api-keys'}"
                >
                </span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto">
      <div class="max-w-7xl mx-auto p-6">
        <ProviderAPIKeyManager v-if="activeSection === 'api-keys'" />
        <!-- Default content when no section is selected -->
        <div v-else class="text-center text-gray-500 mt-12">
          <span class="i-heroicons-cog-8-tooth-20-solid w-12 h-12 mx-auto mb-4"></span>
          <h3 class="text-xl font-medium mb-2">Settings</h3>
          <p>Select a settings category from the sidebar to get started.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ProviderAPIKeyManager from '~/components/settings/ProviderAPIKeyManager.vue'

const activeSection = ref('api-keys')
</script>