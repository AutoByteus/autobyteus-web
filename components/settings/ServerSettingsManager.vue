<template>
  <div class="server-settings-manager h-full flex flex-col overflow-hidden">
    <div class="flex items-center justify-between px-8 pt-8 pb-4 flex-shrink-0">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">Server Settings</h2>
        <p class="text-sm text-gray-500 mt-1">
          Quick setup for common connections. Advanced mode contains raw developer controls.
        </p>
      </div>
    </div>

    <div class="flex-1 overflow-auto p-8">
      <div v-if="store.isLoading" class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <div v-else-if="store.error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p>{{ store.error }}</p>
      </div>

      <div v-else class="space-y-6">
        <div class="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          <button
            type="button"
            class="px-3 py-1.5 text-sm rounded-md transition-colors"
            :class="activeTab === 'quick' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'"
            @click="activeTab = 'quick'"
          >
            Quick Setup
          </button>
          <button
            type="button"
            class="px-3 py-1.5 text-sm rounded-md transition-colors"
            :class="activeTab === 'advanced' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'"
            @click="activeTab = 'advanced'"
          >
            Advanced / Developer
          </button>
        </div>

        <div v-if="activeTab === 'quick'" class="space-y-4">
          <div class="border border-gray-200 rounded-xl bg-white p-5">
            <div class="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 class="text-base font-semibold text-gray-900">Connection Setup</h3>
                <p class="text-sm text-gray-500 mt-1">
                  Configure only the endpoints most users need.
                </p>
              </div>
              <button
                type="button"
                class="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="!hasAnyQuickSettingChanged || isSavingAllQuick"
                @click="saveAllQuickSettings"
              >
                <span
                  v-if="isSavingAllQuick"
                  class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1 inline-block"
                ></span>
                Save All Changes
              </button>
            </div>

            <div class="space-y-4">
              <div
                v-for="field in quickSetupFields"
                :key="field.key"
                class="rounded-lg border border-gray-200 p-4 bg-gray-50/60"
              >
                <div class="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ field.label }}</p>
                    <p class="text-xs text-gray-500 mt-0.5">{{ field.description }}</p>
                  </div>
                  <button
                    type="button"
                    class="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="!isQuickSettingChanged(field.key) || isQuickSettingUpdating(field.key)"
                    :data-testid="`quick-setting-save-${field.key}`"
                    @click="saveQuickSetting(field.key)"
                  >
                    <span
                      v-if="isQuickSettingUpdating(field.key)"
                      class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-1 inline-block"
                    ></span>
                    Save
                  </button>
                </div>

                <input
                  v-model="quickEditedSettings[field.key]"
                  type="text"
                  class="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  :placeholder="field.placeholder"
                  :data-testid="`quick-setting-value-${field.key}`"
                >

                <p v-if="isQuickSettingChanged(field.key)" class="text-xs text-amber-700 mt-2">
                  Unsaved change
                </p>
              </div>
            </div>
          </div>

          <div class="border border-gray-200 rounded-xl bg-white p-5">
            <div class="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 class="text-base font-semibold text-gray-900">Web Search Configuration</h3>
                <p class="text-sm text-gray-500 mt-1">
                  Choose one search provider and provide the required configuration.
                </p>
              </div>
              <button
                type="button"
                class="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="!canSaveSearchConfig || isSavingSearchConfig"
                @click="saveSearchConfig"
              >
                <span
                  v-if="isSavingSearchConfig"
                  class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1 inline-block"
                ></span>
                Save Search Config
              </button>
            </div>

            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-900 mb-1">Search Provider</label>
                <select
                  v-model="selectedSearchProvider"
                  class="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  data-testid="search-provider-select"
                  @blur="markSearchFormTouched"
                >
                  <option value="">Select a provider</option>
                  <option v-for="option in searchProviderOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>

              <div v-if="selectedSearchProvider === 'serper'" class="space-y-2">
                <label class="block text-sm font-medium text-gray-900">Serper API Key</label>
                <input
                  v-model="searchForm.serperApiKey"
                  type="password"
                  class="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  placeholder="Enter Serper API key"
                  data-testid="search-serper-api-key"
                  @blur="markSearchFormTouched"
                >
                <p v-if="store.searchConfig.serperApiKeyConfigured" class="text-xs text-gray-500">
                  A Serper API key is already configured.
                </p>
              </div>

              <div v-if="selectedSearchProvider === 'serpapi'" class="space-y-2">
                <label class="block text-sm font-medium text-gray-900">SerpApi API Key</label>
                <input
                  v-model="searchForm.serpapiApiKey"
                  type="password"
                  class="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  placeholder="Enter SerpApi API key"
                  data-testid="search-serpapi-api-key"
                  @blur="markSearchFormTouched"
                >
                <p v-if="store.searchConfig.serpapiApiKeyConfigured" class="text-xs text-gray-500">
                  A SerpApi API key is already configured.
                </p>
              </div>

              <div v-if="selectedSearchProvider === 'google_cse'" class="space-y-2">
                <label class="block text-sm font-medium text-gray-900">Google CSE API Key</label>
                <input
                  v-model="searchForm.googleCseApiKey"
                  type="password"
                  class="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  placeholder="Enter Google CSE API key"
                  data-testid="search-google-cse-api-key"
                  @blur="markSearchFormTouched"
                >
                <label class="block text-sm font-medium text-gray-900">Google CSE ID</label>
                <input
                  v-model="searchForm.googleCseId"
                  type="text"
                  class="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  placeholder="Enter Google CSE ID"
                  data-testid="search-google-cse-id"
                  @blur="markSearchFormTouched"
                >
                <p v-if="store.searchConfig.googleCseApiKeyConfigured" class="text-xs text-gray-500">
                  A Google CSE API key is already configured.
                </p>
              </div>

              <div v-if="selectedSearchProvider === 'vertex_ai_search'" class="space-y-2">
                <label class="block text-sm font-medium text-gray-900">Vertex AI Search API Key</label>
                <input
                  v-model="searchForm.vertexAiSearchApiKey"
                  type="password"
                  class="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  placeholder="Enter Vertex AI Search API key"
                  data-testid="search-vertex-ai-api-key"
                  @blur="markSearchFormTouched"
                >
                <label class="block text-sm font-medium text-gray-900">Serving Config Path</label>
                <input
                  v-model="searchForm.vertexAiSearchServingConfig"
                  type="text"
                  class="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  placeholder="projects/{project}/locations/{location}/collections/{collection}/engines/{engine}/servingConfigs/{servingConfig}"
                  data-testid="search-vertex-serving-config"
                  @blur="markSearchFormTouched"
                >
                <p v-if="store.searchConfig.vertexAiSearchApiKeyConfigured" class="text-xs text-gray-500">
                  A Vertex AI Search API key is already configured.
                </p>
              </div>

              <p v-if="displayedSearchConfigValidationError" class="text-sm text-red-600">
                {{ displayedSearchConfigValidationError }}
              </p>
            </div>
          </div>
        </div>

        <div v-else class="space-y-4">
          <div class="border border-gray-200 rounded-xl bg-white p-5">
            <h3 class="text-base font-semibold text-gray-900">Developer Tools</h3>
            <p class="text-sm text-gray-500 mt-1">
              Raw environment settings and server diagnostics.
            </p>

            <div class="inline-flex rounded-lg border border-gray-200 bg-white p-1 mt-4">
              <button
                type="button"
                class="px-3 py-1.5 text-sm rounded-md transition-colors"
                :class="advancedPanel === 'raw-settings' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'"
                @click="advancedPanel = 'raw-settings'"
              >
                All Settings
              </button>
              <button
                type="button"
                class="px-3 py-1.5 text-sm rounded-md transition-colors"
                :class="advancedPanel === 'server-status' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'"
                @click="advancedPanel = 'server-status'"
              >
                Server Status & Logs
              </button>
            </div>
          </div>

          <div v-if="advancedPanel === 'server-status'" class="border border-gray-200 rounded-xl bg-white overflow-hidden">
            <ServerMonitor />
          </div>

          <div v-else class="overflow-x-auto">
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

          <div v-if="advancedPanel === 'raw-settings' && newSettingError" class="mt-2 text-sm text-red-600">
            {{ newSettingError }}
          </div>
        </div>
      </div>

      <div
        v-if="notification"
        class="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg"
        :class="notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'"
      >
        {{ notification.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useServerSettingsStore, type SearchProvider } from '~/stores/serverSettings'
import ServerMonitor from '~/components/server/ServerMonitor.vue'

type SettingsTab = 'quick' | 'advanced'
type AdvancedPanel = 'raw-settings' | 'server-status'

interface QuickSetupField {
  key: string
  label: string
  description: string
  placeholder: string
}

const quickSetupFields: QuickSetupField[] = [
  {
    key: 'LMSTUDIO_HOSTS',
    label: 'LM Studio Hosts',
    description: 'Comma-separated LM Studio endpoints.',
    placeholder: 'http://localhost:1234',
  },
  {
    key: 'OLLAMA_HOSTS',
    label: 'Ollama Hosts',
    description: 'Comma-separated Ollama endpoints.',
    placeholder: 'http://localhost:11434',
  },
  {
    key: 'AUTOBYTEUS_LLM_SERVER_HOSTS',
    label: 'AutoByteus LLM Hosts',
    description: 'Comma-separated AutoByteus LLM server endpoints.',
    placeholder: 'http://localhost:5900,http://localhost:5901',
  },
  {
    key: 'AUTOBYTEUS_VNC_SERVER_URLS',
    label: 'AutoByteus VNC URLs',
    description: 'Comma-separated VNC server URLs.',
    placeholder: 'localhost:5900,localhost:5901',
  },
]

const searchProviderOptions: Array<{ value: SearchProvider; label: string }> = [
  { value: 'serper', label: 'Serper' },
  { value: 'serpapi', label: 'SerpApi' },
  { value: 'google_cse', label: 'Google CSE' },
  { value: 'vertex_ai_search', label: 'Vertex AI Search' },
]

const store = useServerSettingsStore()
const activeTab = ref<SettingsTab>('quick')
const advancedPanel = ref<AdvancedPanel>('raw-settings')
const notification = ref<{ type: 'success' | 'error'; message: string } | null>(null)

const editedSettings = reactive<Record<string, string>>({})
const originalSettings = reactive<Record<string, string>>({})
const isUpdating = reactive<Record<string, boolean>>({})

const quickEditedSettings = reactive<Record<string, string>>({})
const quickOriginalSettings = reactive<Record<string, string>>({})
const quickIsUpdating = reactive<Record<string, boolean>>({})
const isSavingAllQuick = ref(false)
const isSavingSearchConfig = ref(false)
const hasAttemptedSearchSave = ref(false)
const isSearchFormTouched = ref(false)

const selectedSearchProvider = ref<SearchProvider | ''>('')
const searchForm = reactive({
  serperApiKey: '',
  serpapiApiKey: '',
  googleCseApiKey: '',
  googleCseId: '',
  vertexAiSearchApiKey: '',
  vertexAiSearchServingConfig: '',
})

const newSetting = reactive({
  key: '',
  value: '',
})
const newSettingError = ref('')
const isAddingNewSetting = ref(false)

const isNewSettingValid = computed(() => {
  newSettingError.value = ''

  if (!newSetting.key.trim()) {
    return false
  }

  const keyExists = store.settings.some(setting => setting.key === newSetting.key)
  if (keyExists) {
    newSettingError.value = 'Setting with this key already exists'
    return false
  }

  return true
})

const isSettingChanged = (key: string) => editedSettings[key] !== originalSettings[key]
const isQuickSettingChanged = (key: string) => quickEditedSettings[key] !== quickOriginalSettings[key]
const isQuickSettingUpdating = (key: string) => quickIsUpdating[key] === true

const hasAnyQuickSettingChanged = computed(() =>
  quickSetupFields.some(field => isQuickSettingChanged(field.key)),
)

const searchConfigValidationError = computed(() => {
  const provider = selectedSearchProvider.value
  if (!provider) return 'Please select a search provider.'

  const hasSerperKey = Boolean(searchForm.serperApiKey.trim()) || store.searchConfig.serperApiKeyConfigured
  const hasSerpapiKey = Boolean(searchForm.serpapiApiKey.trim()) || store.searchConfig.serpapiApiKeyConfigured
  const hasGoogleApiKey =
    Boolean(searchForm.googleCseApiKey.trim()) || store.searchConfig.googleCseApiKeyConfigured
  const hasGoogleId = Boolean(searchForm.googleCseId.trim())
  const hasVertexApiKey =
    Boolean(searchForm.vertexAiSearchApiKey.trim()) || store.searchConfig.vertexAiSearchApiKeyConfigured
  const hasVertexServingConfig = Boolean(searchForm.vertexAiSearchServingConfig.trim())

  if (provider === 'serper' && !hasSerperKey) {
    return 'Serper API key is required.'
  }
  if (provider === 'serpapi' && !hasSerpapiKey) {
    return 'SerpApi API key is required.'
  }
  if (provider === 'google_cse' && (!hasGoogleApiKey || !hasGoogleId)) {
    return 'Google CSE API key and Google CSE ID are required.'
  }
  if (provider === 'vertex_ai_search' && (!hasVertexApiKey || !hasVertexServingConfig)) {
    return 'Vertex AI Search API key and serving config path are required.'
  }

  return ''
})

const hasSearchConfigChanges = computed(() => {
  const existingProvider = store.searchConfig.provider
  if (!selectedSearchProvider.value) return false

  if (selectedSearchProvider.value !== existingProvider) {
    return true
  }

  if (searchForm.serperApiKey.trim() || searchForm.serpapiApiKey.trim()) {
    return true
  }
  if (searchForm.googleCseApiKey.trim() || searchForm.vertexAiSearchApiKey.trim()) {
    return true
  }
  if (searchForm.googleCseId.trim() !== (store.searchConfig.googleCseId ?? '')) {
    return true
  }
  if (
    searchForm.vertexAiSearchServingConfig.trim() !== (store.searchConfig.vertexAiSearchServingConfig ?? '')
  ) {
    return true
  }

  return false
})

const canSaveSearchConfig = computed(() =>
  Boolean(selectedSearchProvider.value) &&
  !searchConfigValidationError.value &&
  hasSearchConfigChanges.value,
)

const displayedSearchConfigValidationError = computed(() => {
  if (!hasAttemptedSearchSave.value && !isSearchFormTouched.value) {
    return ''
  }
  return searchConfigValidationError.value
})

const markSearchFormTouched = () => {
  isSearchFormTouched.value = true
}

const applySearchConfigToForm = () => {
  selectedSearchProvider.value = store.searchConfig.provider
  searchForm.serperApiKey = ''
  searchForm.serpapiApiKey = ''
  searchForm.googleCseApiKey = ''
  searchForm.googleCseId = store.searchConfig.googleCseId ?? ''
  searchForm.vertexAiSearchApiKey = ''
  searchForm.vertexAiSearchServingConfig = store.searchConfig.vertexAiSearchServingConfig ?? ''
  isSearchFormTouched.value = false
  hasAttemptedSearchSave.value = false
}

watch(
  () => store.settings,
  (newSettings) => {
    if (!Array.isArray(newSettings)) return

    const settingsMap = new Map(newSettings.map(setting => [setting.key, setting.value]))
    const seenRawKeys = new Set<string>()

    newSettings.forEach((setting) => {
      seenRawKeys.add(setting.key)

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

    Object.keys(editedSettings).forEach((key) => {
      if (!seenRawKeys.has(key)) {
        delete editedSettings[key]
        delete originalSettings[key]
        delete isUpdating[key]
      }
    })

    quickSetupFields.forEach((field) => {
      const currentValue = settingsMap.get(field.key) ?? ''
      const hasEditedValue = Object.prototype.hasOwnProperty.call(quickEditedSettings, field.key)
      const currentEdited = quickEditedSettings[field.key]
      const currentOriginal = quickOriginalSettings[field.key]

      if (!hasEditedValue || currentEdited === currentOriginal) {
        quickEditedSettings[field.key] = currentValue
      }

      quickOriginalSettings[field.key] = currentValue

      if (!(field.key in quickIsUpdating)) {
        quickIsUpdating[field.key] = false
      }
    })
  },
  { immediate: true },
)

onMounted(async () => {
  try {
    await store.fetchServerSettings()
    await store.fetchSearchConfig()
    applySearchConfigToForm()
  } catch (error) {
    console.error('Failed to load server settings or search config:', error)
    showNotification('Failed to load quick setup configuration', 'error')
  }
})

const showNotification = (message: string, type: 'success' | 'error') => {
  notification.value = { message, type }
  setTimeout(() => {
    notification.value = null
  }, 3000)
}

const saveQuickSetting = async (key: string) => {
  if (!isQuickSettingChanged(key)) return

  quickIsUpdating[key] = true
  try {
    await store.updateServerSetting(key, quickEditedSettings[key])
    quickOriginalSettings[key] = quickEditedSettings[key]
    showNotification(`Setting "${key}" saved successfully`, 'success')
  } catch (error: any) {
    showNotification(error.message || `Failed to save setting "${key}"`, 'error')
  } finally {
    quickIsUpdating[key] = false
  }
}

const saveAllQuickSettings = async () => {
  const keysToSave = quickSetupFields
    .map(field => field.key)
    .filter(key => isQuickSettingChanged(key))

  if (keysToSave.length === 0) return

  isSavingAllQuick.value = true

  try {
    for (const key of keysToSave) {
      quickIsUpdating[key] = true
      await store.updateServerSetting(key, quickEditedSettings[key])
      quickOriginalSettings[key] = quickEditedSettings[key]
      quickIsUpdating[key] = false
    }
    showNotification('Quick setup changes saved successfully', 'success')
  } catch (error: any) {
    keysToSave.forEach((key) => {
      quickIsUpdating[key] = false
    })
    showNotification(error.message || 'Failed to save quick setup settings', 'error')
  } finally {
    isSavingAllQuick.value = false
  }
}

const saveSearchConfig = async () => {
  hasAttemptedSearchSave.value = true
  if (!canSaveSearchConfig.value || !selectedSearchProvider.value) return

  isSavingSearchConfig.value = true

  try {
    await store.setSearchConfig({
      provider: selectedSearchProvider.value,
      serperApiKey: searchForm.serperApiKey.trim() || null,
      serpapiApiKey: searchForm.serpapiApiKey.trim() || null,
      googleCseApiKey: searchForm.googleCseApiKey.trim() || null,
      googleCseId: searchForm.googleCseId.trim() || null,
      vertexAiSearchApiKey: searchForm.vertexAiSearchApiKey.trim() || null,
      vertexAiSearchServingConfig: searchForm.vertexAiSearchServingConfig.trim() || null,
    })
    applySearchConfigToForm()
    showNotification('Search configuration saved successfully', 'success')
  } catch (error: any) {
    showNotification(error.message || 'Failed to save search configuration', 'error')
  } finally {
    isSavingSearchConfig.value = false
  }
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
    await store.fetchServerSettings()

    store.settings.forEach(setting => {
      if (!(setting.key in editedSettings)) {
        editedSettings[setting.key] = setting.value
        originalSettings[setting.key] = setting.value
        isUpdating[setting.key] = false
      }
    })

    newSetting.key = ''
    newSetting.value = ''
    showNotification('Custom setting added successfully', 'success')
  } catch (error: any) {
    newSettingError.value = error.message || 'Failed to add custom setting'
    showNotification(error.message || 'Failed to add custom setting', 'error')
  } finally {
    isAddingNewSetting.value = false
  }
}
</script>
