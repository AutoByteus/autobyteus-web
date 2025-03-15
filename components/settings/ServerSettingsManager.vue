<template>
  <div class="server-settings-manager bg-white rounded-lg shadow-lg">
    <div class="p-6">
      <h2 class="text-2xl font-semibold text-gray-800 mb-6">Server Settings</h2>
      
      <div v-if="store.isLoading" class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <div v-else-if="store.error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p>{{ store.error }}</p>
      </div>

      <div v-else class="space-y-6">
        <!-- Settings List -->
        <div v-if="store.settings.length === 0" class="text-gray-500 py-4">
          No server settings found.
        </div>
        
        <div v-else>
          <!-- Settings Table -->
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Setting
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="setting in store.settings" :key="setting.key">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ setting.key }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <input
                      v-model="editedSettings[setting.key]"
                      type="text"
                      class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      :placeholder="`Enter ${setting.key}`"
                    >
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ setting.description }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      @click="saveIndividualSetting(setting.key)"
                      :disabled="!isSettingChanged(setting.key) || store.isUpdating"
                      class="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span v-if="isUpdating[setting.key]" class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-1 inline-block"></span>
                      Save
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Save All Button -->
        <div class="flex justify-end mt-4">
          <button
            @click="saveAllSettings"
            :disabled="!hasAnySettingChanged || store.isUpdating"
            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="store.isUpdating" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
            {{ store.isUpdating ? 'Saving...' : 'Save All Changes' }}
          </button>
        </div>
      </div>

      <!-- Notifications -->
      <div
        v-if="notification"
        class="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg"
        :class="notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
      >
        {{ notification.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { useServerSettingsStore } from '~/stores/serverSettings'

const store = useServerSettingsStore()
const notification = ref<{ type: 'success' | 'error'; message: string } | null>(null)
const editedSettings = reactive<Record<string, string>>({})
const originalSettings = reactive<Record<string, string>>({})
const isUpdating = reactive<Record<string, boolean>>({})

// Computed property to check if any setting has changed
const hasAnySettingChanged = computed(() => {
  return Object.keys(editedSettings).some(key => 
    editedSettings[key] !== originalSettings[key]
  )
})

// Method to check if an individual setting has changed
const isSettingChanged = (key: string) => {
  return editedSettings[key] !== originalSettings[key]
}

onMounted(async () => {
  try {
    await store.fetchServerSettings()
    
    // Initialize the edited and original settings
    store.settings.forEach(setting => {
      editedSettings[setting.key] = setting.value
      originalSettings[setting.key] = setting.value
      isUpdating[setting.key] = false
    })
  } catch (error) {
    console.error('Failed to load server settings:', error)
    showNotification('Failed to load server settings', 'error')
  }
})

const showNotification = (message: string, type: 'success' | 'error') => {
  notification.value = { message, type }
  setTimeout(() => {
    notification.value = null
  }, 3000)
}

const saveIndividualSetting = async (key: string) => {
  if (!isSettingChanged(key)) return
  
  isUpdating[key] = true
  
  try {
    await store.updateServerSetting(key, editedSettings[key])
    originalSettings[key] = editedSettings[key]
    showNotification(`Setting "${key}" saved successfully`, 'success')
  } catch (error: any) {
    showNotification(error.message || `Failed to save setting "${key}"`, 'error')
  } finally {
    isUpdating[key] = false
  }
}

const saveAllSettings = async () => {
  if (!hasAnySettingChanged.value) return
  
  store.isUpdating = true
  
  try {
    const changedKeys = Object.keys(editedSettings).filter(key => 
      editedSettings[key] !== originalSettings[key]
    )
    
    for (const key of changedKeys) {
      await store.updateServerSetting(key, editedSettings[key])
      originalSettings[key] = editedSettings[key]
    }
    
    showNotification('All settings saved successfully', 'success')
  } catch (error: any) {
    showNotification(error.message || 'Failed to save settings', 'error')
  } finally {
    store.isUpdating = false
  }
}
</script>
