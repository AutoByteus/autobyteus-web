<template>
  <div
    v-if="windowNodeContextStore.isEmbeddedWindow"
    class="server-settings-manager h-full flex flex-col overflow-hidden"
  >
    <div class="flex items-center justify-between px-8 pt-8 pb-4 flex-shrink-0">
      <h2 class="text-xl font-semibold text-gray-900">Server Settings</h2>
    </div>
    
    <div class="flex-1 overflow-auto p-8">
      
      <div v-if="store.isLoading" class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <div v-else-if="store.error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p>{{ store.error }}</p>
      </div>

      <div v-else class="space-y-6">
        <!-- Settings Table with scrolling container -->
        <div class="overflow-x-auto">
          <div class="border border-gray-200 rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-blue-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider" style="width: 25%">Setting</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider" style="width: 25%">Value</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider" style="width: 40%">Description</th>
                  <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-blue-700 uppercase tracking-wider" style="width: 10%">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <!-- Existing Settings -->
                <tr v-for="setting in store.settings" :key="setting.key" class="hover:bg-gray-50 transition-colors duration-150">
                  <td class="px-6 py-4 align-middle">
                    <div class="text-sm font-medium text-gray-900 break-all" :title="setting.key">{{ setting.key }}</div>
                  </td>
                  <td class="px-6 py-4 align-middle">
                    <input
                      v-model="editedSettings[setting.key]"
                      type="text"
                      :data-testid="`server-setting-value-${setting.key}`"
                      class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors duration-150 text-gray-900 placeholder-gray-500"
                      placeholder="Enter value"
                    >
                  </td>
                  <td class="px-6 py-4 align-middle">
                    <div class="text-sm text-gray-700">{{ setting.description }}</div>
                  </td>
                  <td class="px-6 py-4 text-right align-middle">
                    <button
                      @click="saveIndividualSetting(setting.key)"
                      :disabled="!isSettingChanged(setting.key) || store.isUpdating"
                      :data-testid="`server-setting-save-${setting.key}`"
                      class="px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                    >
                      <span v-if="isUpdating[setting.key]" class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-1 inline-block"></span>
                      Save
                    </button>
                  </td>
                </tr>
                
                <!-- New Setting Row -->
                <tr class="bg-gray-50 hover:bg-gray-100 transition-colors duration-150">
                  <td class="px-6 py-4 align-middle">
                    <input
                      v-model="newSetting.key"
                      type="text"
                      placeholder="Enter new setting key"
                      class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    >
                  </td>
                  <td class="px-6 py-4 align-middle">
                    <input
                      v-model="newSetting.value"
                      type="text"
                      placeholder="Enter value"
                      class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    >
                  </td>
                  <td class="px-6 py-4 align-middle">
                    <div class="text-sm text-gray-500 italic">Custom user-defined setting</div>
                  </td>
                  <td class="px-6 py-4 text-right align-middle">
                    <button
                      @click="addNewSetting"
                      :disabled="!isNewSettingValid || isAddingNewSetting"
                      class="px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                    >
                      <span v-if="isAddingNewSetting" class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-1 inline-block"></span>
                      Save
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Error message for new setting -->
        <div v-if="newSettingError" class="mt-2 text-sm text-red-600">
          {{ newSettingError }}
        </div>
      </div>

      <!-- Notifications -->
      <div
        v-if="notification"
        class="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg"
        :class="notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'"
      >
        {{ notification.message }}
      </div>
    </div>
  </div>
  <div v-else class="h-full flex items-center justify-center text-gray-500 p-8">
    Embedded server settings are unavailable for remote node windows.
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive, watch } from 'vue'
import { useServerSettingsStore } from '~/stores/serverSettings'
import { useWindowNodeContextStore } from '~/stores/windowNodeContextStore'

const store = useServerSettingsStore()
const windowNodeContextStore = useWindowNodeContextStore()
const notification = ref<{ type: 'success' | 'error'; message: string } | null>(null)
const editedSettings = reactive<Record<string, string>>({})
const originalSettings = reactive<Record<string, string>>({})
const isUpdating = reactive<Record<string, boolean>>({})

// New setting state
const newSetting = reactive({
  key: '',
  value: ''
})
const newSettingError = ref('')
const isAddingNewSetting = ref(false)

// Computed property to check if any setting has changed
const hasAnySettingChanged = computed(() => {
  return Object.keys(editedSettings).some(key => 
    editedSettings[key] !== originalSettings[key]
  )
})

// Computed property to validate new setting
const isNewSettingValid = computed(() => {
  // Reset error message when inputs change
  newSettingError.value = ''
  
  // Key must not be empty
  if (!newSetting.key.trim()) {
    return false
  }
  
  // Key must not already exist
  const keyExists = store.settings.some(setting => setting.key === newSetting.key)
  if (keyExists) {
    newSettingError.value = 'Setting with this key already exists'
    return false
  }
  
  return true
})

// Method to check if an individual setting has changed
const isSettingChanged = (key: string) => {
  return editedSettings[key] !== originalSettings[key]
}

watch(
  () => store.settings,
  (newSettings) => {
    if (!Array.isArray(newSettings)) return

    const seenKeys = new Set<string>()

    newSettings.forEach((setting) => {
      seenKeys.add(setting.key)

      const hasEditedValue = Object.prototype.hasOwnProperty.call(editedSettings, setting.key)
      const currentEdited = editedSettings[setting.key]
      const currentOriginal = originalSettings[setting.key]

      if (!hasEditedValue || currentEdited === currentOriginal) {
        editedSettings[setting.key] = setting.value
      }

      originalSettings[setting.key] = setting.value

      if (!(setting.key in isUpdating)) {
        isUpdating[setting.key] = false
      }
    })

    // Remove stale keys that no longer exist in the store
    Object.keys(editedSettings).forEach((key) => {
      if (!seenKeys.has(key)) {
        delete editedSettings[key]
        delete originalSettings[key]
        delete isUpdating[key]
      }
    })
  },
  { immediate: true }
)

onMounted(async () => {
  if (!windowNodeContextStore.isEmbeddedWindow) {
    return
  }

  try {
    await store.fetchServerSettings()
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

const addNewSetting = async () => {
  if (!isNewSettingValid.value) return
  
  isAddingNewSetting.value = true
  
  try {
    await store.updateServerSetting(newSetting.key, newSetting.value)
    
    // After our successful addition, refresh the settings list
    await store.fetchServerSettings()
    
    // Update the local state
    store.settings.forEach(setting => {
      if (!(setting.key in editedSettings)) {
        editedSettings[setting.key] = setting.value
        originalSettings[setting.key] = setting.value
        isUpdating[setting.key] = false
      }
    })
    
    // Reset the new setting form
    newSetting.key = ''
    newSetting.value = ''
    
    showNotification(`Custom setting added successfully`, 'success')
  } catch (error: any) {
    newSettingError.value = error.message || 'Failed to add custom setting'
    showNotification(error.message || 'Failed to add custom setting', 'error')
  } finally {
    isAddingNewSetting.value = false
  }
}
</script>
