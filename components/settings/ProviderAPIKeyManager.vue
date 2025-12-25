<template>
  <div class="provider-api-key-manager bg-white rounded-lg shadow-lg">
    <div class="p-6">
      <h2 class="text-2xl font-semibold text-gray-800 mb-6">
        API Key Management
      </h2>

      <div v-if="loading" class="flex justify-center items-center py-8">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
        ></div>
      </div>

      <div v-else class="space-y-6">
        <!-- Provider Sidebar + Details Panel (includes API key config and models) -->
        <div class="mt-8">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <h3 class="text-lg font-medium text-gray-800">
                Available Models
              </h3>
              <button
                @click="refreshModels"
                class="ml-2 p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100 transition-colors duration-200"
                title="Refresh models"
                :disabled="isLoadingModels || isReloadingModels"
              >
                <span
                  class="i-heroicons-arrow-path-20-solid w-5 h-5"
                  :class="{
                    'animate-spin': isLoadingModels || isReloadingModels,
                  }"
                ></span>
              </button>
            </div>
            <button
              @click="refreshModels"
              class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="isLoadingModels || isReloadingModels"
            >
              <span
                v-if="isLoadingModels || isReloadingModels"
                class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
              ></span>
              {{
                isLoadingModels || isReloadingModels
                  ? "Reloading..."
                  : "Reload Models"
              }}
            </button>
          </div>

          <div
            v-if="isLoadingModels || isReloadingModels"
            class="flex justify-center items-center py-6"
          >
            <div
              class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"
            ></div>
            <p class="text-gray-600">
              {{
                isReloadingModels
                  ? "Reloading and discovering models..."
                  : "Loading available models..."
              }}
            </p>
          </div>
          <div
            v-else-if="!hasAnyModels"
            class="bg-gray-50 rounded-lg p-6 text-center"
          >
            <span
              class="i-heroicons-cube-transparent-20-solid w-10 h-10 text-gray-400 mx-auto mb-3"
            ></span>
            <p class="text-gray-600">
              No models available. Configure at least one provider API key to
              see available models.
            </p>
          </div>
          
          <!-- Two-column layout: Provider Sidebar + Model Panel -->
          <div v-else class="flex gap-4">
            <!-- Left Sidebar: Provider List -->
            <div class="w-56 flex-shrink-0 border border-gray-200 rounded-lg overflow-hidden">
              <div class="bg-gray-50 px-3 py-2 border-b border-gray-200">
                <span class="text-sm font-medium text-gray-600">Providers</span>
              </div>
              <div>
                <button
                  v-for="provider in allProvidersWithModels"
                  :key="`sidebar-${provider.name}`"
                  @click="selectProviderForModels(provider.name)"
                  class="w-full px-3 py-2.5 flex items-center justify-between text-left transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                  :class="[
                    selectedModelProvider === provider.name
                      ? 'bg-blue-50 border-l-2 border-l-blue-500'
                      : 'hover:bg-gray-50 border-l-2 border-l-transparent',
                  ]"
                >
                  <div class="flex items-center min-w-0">
                    <span
                      class="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                      :class="isProviderConfigured(provider.name) ? 'bg-green-500' : 'bg-gray-300'"
                    ></span>
                    <span 
                      class="text-sm font-medium truncate"
                      :class="selectedModelProvider === provider.name ? 'text-blue-700' : 'text-gray-700'"
                    >
                      {{ provider.name }}
                    </span>
                  </div>
                  <div class="flex items-center gap-1 flex-shrink-0 ml-2">
                    <span 
                      class="text-xs px-1.5 py-0.5 rounded-full"
                      :class="isProviderConfigured(provider.name) 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-400'"
                    >
                      {{ provider.totalModels }}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <!-- Right Panel: Models for Selected Provider -->
            <div class="flex-1 border border-gray-200 rounded-lg overflow-hidden">
              <!-- Panel Header -->
              <div 
                class="px-4 py-3 border-b flex items-center justify-between"
                :class="isProviderConfigured(selectedModelProvider) 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200'"
              >
                <div class="flex items-center">
                  <span
                    class="w-2.5 h-2.5 rounded-full mr-2"
                    :class="isProviderConfigured(selectedModelProvider) ? 'bg-green-500' : 'bg-gray-400'"
                  ></span>
                  <span class="font-semibold text-gray-800">{{ selectedModelProvider }}</span>
                </div>
                <span 
                  class="text-xs px-2 py-1 rounded-full"
                  :class="isProviderConfigured(selectedModelProvider) 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-500'"
                >
                  {{ isProviderConfigured(selectedModelProvider) ? 'Configured' : 'Not Configured' }}
                </span>
              </div>

              <!-- API Key Configuration Section -->
              <div class="px-4 py-3 border-b border-gray-100 bg-white">
                <div class="flex items-center justify-between mb-2">
                  <label class="text-sm font-medium text-gray-700">API Key</label>
                  <span 
                    v-if="isProviderConfigured(selectedModelProvider)"
                    class="text-xs text-green-600 flex items-center"
                  >
                    <span class="i-heroicons-check-circle-20-solid w-4 h-4 mr-1"></span>
                    Key saved
                  </span>
                </div>
                <div class="flex gap-2">
                  <div class="relative flex-1">
                    <input
                      v-model="apiKey"
                      :type="showApiKey ? 'text' : 'password'"
                      class="w-full p-2 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      :placeholder="isProviderConfigured(selectedModelProvider) ? 'Enter new key to update...' : 'Enter API key...'"
                    />
                    <button
                      @click="toggleApiKeyVisibility"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      type="button"
                    >
                      <span v-if="showApiKey" class="i-heroicons-eye-slash-20-solid w-4 h-4"></span>
                      <span v-else class="i-heroicons-eye-20-solid w-4 h-4"></span>
                    </button>
                  </div>
                  <button
                    @click="saveApiKeyForSelectedProvider"
                    :disabled="!apiKey || saving"
                    class="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <span
                      v-if="saving"
                      class="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"
                    ></span>
                    {{ saving ? 'Saving...' : 'Save' }}
                  </button>
                </div>
              </div>

              <!-- Panel Content: Models by Type -->
              <div class="p-4 space-y-4">
                <!-- LLM Models -->
                <div v-if="selectedProviderLlmModels.length > 0">
                  <h4 class="text-sm font-medium text-gray-600 mb-2 flex items-center">
                    <span class="i-heroicons-cube-20-solid w-4 h-4 text-blue-500 mr-1.5"></span>
                    LLM Models
                    <span class="ml-2 text-xs text-gray-400">({{ selectedProviderLlmModels.length }})</span>
                  </h4>
                  <div class="grid gap-2 grid-cols-1 sm:grid-cols-2">
                    <div 
                      v-for="model in selectedProviderLlmModels" 
                      :key="`panel-llm-${model.modelIdentifier}`"
                      class="p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center"
                    >
                      <span class="i-heroicons-cube-20-solid w-4 h-4 text-blue-600 mr-2 flex-shrink-0"></span>
                      <span 
                        class="text-sm font-medium text-gray-800 truncate" 
                        :title="model.modelIdentifier"
                      >
                        {{ model.modelIdentifier }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Audio Models -->
                <div v-if="selectedProviderAudioModels.length > 0">
                  <h4 class="text-sm font-medium text-gray-600 mb-2 flex items-center">
                    <span class="i-heroicons-speaker-wave-20-solid w-4 h-4 text-purple-500 mr-1.5"></span>
                    Audio Models
                    <span class="ml-2 text-xs text-gray-400">({{ selectedProviderAudioModels.length }})</span>
                  </h4>
                  <div class="grid gap-2 grid-cols-1 sm:grid-cols-2">
                    <div 
                      v-for="model in selectedProviderAudioModels" 
                      :key="`panel-audio-${model.modelIdentifier}`"
                      class="p-2 bg-purple-50 border border-purple-200 rounded-lg flex items-center"
                    >
                      <span class="i-heroicons-speaker-wave-20-solid w-4 h-4 text-purple-600 mr-2 flex-shrink-0"></span>
                      <span 
                        class="text-sm font-medium text-gray-800 truncate" 
                        :title="model.modelIdentifier"
                      >
                        {{ model.modelIdentifier }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Image Models -->
                <div v-if="selectedProviderImageModels.length > 0">
                  <h4 class="text-sm font-medium text-gray-600 mb-2 flex items-center">
                    <span class="i-heroicons-photo-20-solid w-4 h-4 text-amber-500 mr-1.5"></span>
                    Image Models
                    <span class="ml-2 text-xs text-gray-400">({{ selectedProviderImageModels.length }})</span>
                  </h4>
                  <div class="grid gap-2 grid-cols-1 sm:grid-cols-2">
                    <div 
                      v-for="model in selectedProviderImageModels" 
                      :key="`panel-image-${model.modelIdentifier}`"
                      class="p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center"
                    >
                      <span class="i-heroicons-photo-20-solid w-4 h-4 text-amber-600 mr-2 flex-shrink-0"></span>
                      <span 
                        class="text-sm font-medium text-gray-800 truncate" 
                        :title="model.modelIdentifier"
                      >
                        {{ model.modelIdentifier }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Empty state for selected provider -->
                <div 
                  v-if="selectedProviderLlmModels.length === 0 && selectedProviderAudioModels.length === 0 && selectedProviderImageModels.length === 0"
                  class="text-center py-8"
                >
                  <span class="i-heroicons-cube-transparent-20-solid w-8 h-8 text-gray-300 mx-auto mb-2"></span>
                  <p class="text-sm text-gray-500">No models available for this provider</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Notifications -->
      <div
        v-if="notification"
        class="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg"
        :class="
          notification.type === 'success'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        "
      >
        {{ notification.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { storeToRefs } from "pinia";
import { useLLMProviderConfigStore } from "~/stores/llmProviderConfig";

const store = useLLMProviderConfigStore();
// Use storeToRefs for reactive state properties
const {
  isLoadingModels,
  isReloadingModels,
  providers,
  providersWithModels,
  audioProvidersWithModels,
  imageProvidersWithModels,
} = storeToRefs(store);

// Computed properties for provider groups with models (filter out empty ones)
const llmProvidersWithModels = computed(() => 
  (providersWithModels.value || []).filter(p => p.models && p.models.length > 0)
);

// Track expanded state for each provider section
// Key format: `${modelType}-${provider}` e.g., "llm-ANTHROPIC"
const expandedProviders = ref<Record<string, boolean>>({});

// Initialize expansion state - configured providers expanded by default
const initializeExpansionState = () => {
  const allProviderGroups = [
    ...(providersWithModels.value || []).map(p => ({ type: 'llm', provider: p.provider })),
    ...(audioProvidersWithModels.value || []).map(p => ({ type: 'audio', provider: p.provider })),
    ...(imageProvidersWithModels.value || []).map(p => ({ type: 'image', provider: p.provider })),
  ];
  
  allProviderGroups.forEach(({ type, provider }) => {
    const key = `${type}-${provider}`;
    // Only set if not already set (preserve user's expansion state)
    if (expandedProviders.value[key] === undefined) {
      expandedProviders.value[key] = isProviderConfigured(provider);
    }
  });
};

const isProviderExpanded = (modelType: string, provider: string): boolean => {
  const key = `${modelType}-${provider}`;
  // Default to expanded for configured providers, collapsed for unconfigured
  if (expandedProviders.value[key] === undefined) {
    return isProviderConfigured(provider);
  }
  return expandedProviders.value[key];
};

const toggleProviderExpansion = (modelType: string, provider: string) => {
  const key = `${modelType}-${provider}`;
  expandedProviders.value[key] = !isProviderExpanded(modelType, provider);
};

const isProviderConfigured = (provider: string): boolean => {
  return !!providerConfigs.value[provider]?.apiKey;
};

const loading = ref(true);
const saving = ref(false);
const apiKey = ref("");
const showApiKey = ref(false);
const notification = ref<{ type: "success" | "error"; message: string } | null>(
  null
);

const providerConfigs = ref<Record<string, { apiKey?: string }>>({});

// Computed property to check if we have any models
const hasAnyModels = computed(
  () =>
    llmProvidersWithModels.value.length > 0 ||
    (audioProvidersWithModels.value || []).some(p => p.models && p.models.length > 0) ||
    (imageProvidersWithModels.value || []).some(p => p.models && p.models.length > 0)
);

// ============ Provider Sidebar + Model Panel State ============

// Track which provider is selected in the Available Models section
const selectedModelProvider = ref<string>("");

// Combined list of ALL providers with their model counts
// Each entry has: name, totalModels (across all types)
interface ProviderSummary {
  name: string;
  totalModels: number;
}

const allProvidersWithModels = computed<ProviderSummary[]>(() => {
  const providerMap = new Map<string, number>();
  
  // First, ensure ALL providers from the providers list are included
  (providers.value || []).forEach(p => {
    providerMap.set(p, 0);
  });
  
  // Count LLM models per provider
  (providersWithModels.value || []).forEach(p => {
    const count = p.models?.length || 0;
    providerMap.set(p.provider, (providerMap.get(p.provider) || 0) + count);
  });
  
  // Count Audio models per provider  
  (audioProvidersWithModels.value || []).forEach(p => {
    const count = p.models?.length || 0;
    providerMap.set(p.provider, (providerMap.get(p.provider) || 0) + count);
  });
  
  // Count Image models per provider
  (imageProvidersWithModels.value || []).forEach(p => {
    const count = p.models?.length || 0;
    providerMap.set(p.provider, (providerMap.get(p.provider) || 0) + count);
  });
  
  // Convert to array - include ALL providers (even with 0 models)
  return Array.from(providerMap.entries())
    .map(([name, totalModels]) => ({ name, totalModels }))
    .sort((a, b) => a.name.localeCompare(b.name));
});

// Get LLM models for the selected provider
const selectedProviderLlmModels = computed(() => {
  if (!selectedModelProvider.value) return [];
  const providerGroup = (providersWithModels.value || []).find(
    p => p.provider === selectedModelProvider.value
  );
  return providerGroup?.models || [];
});

// Get Audio models for the selected provider
const selectedProviderAudioModels = computed(() => {
  if (!selectedModelProvider.value) return [];
  const providerGroup = (audioProvidersWithModels.value || []).find(
    p => p.provider === selectedModelProvider.value
  );
  return providerGroup?.models || [];
});

// Get Image models for the selected provider
const selectedProviderImageModels = computed(() => {
  if (!selectedModelProvider.value) return [];
  const providerGroup = (imageProvidersWithModels.value || []).find(
    p => p.provider === selectedModelProvider.value
  );
  return providerGroup?.models || [];
});

// Select a provider to view its models
const selectProviderForModels = (providerName: string) => {
  selectedModelProvider.value = providerName;
};

// Auto-select first configured provider (or first provider if none configured)
const initializeSelectedProvider = () => {
  if (allProvidersWithModels.value.length === 0) return;
  
  // Try to find first configured provider
  const configuredProvider = allProvidersWithModels.value.find(
    p => isProviderConfigured(p.name)
  );
  
  if (configuredProvider) {
    selectedModelProvider.value = configuredProvider.name;
  } else {
    // Fall back to first provider
    selectedModelProvider.value = allProvidersWithModels.value[0].name;
  }
};

const refreshModels = async () => {
  try {
    // Call reloadModels to force backend to rediscover models first
    await store.reloadModels();
    showNotification("Models reloaded and refreshed successfully", "success");
  } catch (error) {
    console.error("Failed to reload models:", error);
    showNotification("Failed to reload models", "error");
  }
};

onMounted(async () => {
  try {
    await store.fetchProvidersWithModels();

    // Load existing configurations in parallel
    const keyFetchPromises = providers.value.map(async (provider) => {
      try {
        const apiKey = await store.getLLMProviderApiKey(provider);
        // Check specifically for non-empty strings to determine if configured
        if (apiKey && typeof apiKey === "string" && apiKey.trim() !== "") {
          providerConfigs.value[provider] = { apiKey: "********" };
        } else {
          // Ensure provider exists in providerConfigs but without apiKey property
          providerConfigs.value[provider] = {};
        }
      } catch (error) {
        console.error(`Failed to load API key for ${provider}:`, error);
        // Ensure provider exists in providerConfigs but without apiKey property
        providerConfigs.value[provider] = {};
      }
    });

    await Promise.all(keyFetchPromises);
    
    // Initialize the selected provider for the models panel
    initializeSelectedProvider();
  } catch (error) {
    console.error("Failed to load providers or models:", error);
    showNotification("Failed to load providers and models", "error");
  } finally {
    loading.value = false;
  }
});

const toggleApiKeyVisibility = () => {
  showApiKey.value = !showApiKey.value;
};

const showNotification = (message: string, type: "success" | "error") => {
  notification.value = { message, type };
  setTimeout(() => {
    notification.value = null;
  }, 3000);
};

const saveApiKeyForSelectedProvider = async () => {
  if (!selectedModelProvider.value || !apiKey.value) return;

  saving.value = true;
  try {
    await store.setLLMProviderApiKey(selectedModelProvider.value, apiKey.value);
    providerConfigs.value[selectedModelProvider.value] = { apiKey: "********" };

    showNotification(
      `API key for ${selectedModelProvider.value} saved successfully`,
      "success"
    );
    apiKey.value = "";
  } catch (error) {
    console.error("Failed to save API key or reload models:", error);
    showNotification(
      `Failed to save API key for ${selectedModelProvider.value}`,
      "error"
    );
  } finally {
    saving.value = false;
  }
};
</script>
