<template>
  <div class="provider-api-key-manager bg-white rounded-lg shadow-lg">
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-semibold text-gray-800">
          API Key Management
        </h2>
        <button
          @click="refreshModels"
          class="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
          title="Reload all models"
          :disabled="isLoadingModels || isReloadingModels"
        >
          <span
            class="i-heroicons-arrow-path-20-solid w-5 h-5 mr-2 text-gray-500 group-hover:text-gray-700"
            :class="{ 'animate-spin': isLoadingModels || isReloadingModels }"
          ></span>
          Reload Models
        </button>
      </div>

      <div v-if="loading" class="flex justify-center items-center py-8">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
        ></div>
      </div>

      <div v-else class="space-y-6">
        <!-- Provider Sidebar + Details Panel (includes API key config and models) -->
        <div class="mt-4">
          
          <!-- Loading state for models -->
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
          <div v-else class="flex gap-6 items-start">
            <!-- Left Sidebar: Provider List -->
            <div class="w-64 flex-shrink-0 bg-gray-50/50 rounded-xl overflow-hidden border border-gray-200">
              <div class="px-4 py-3 border-b border-gray-200/60 bg-gray-50">
                <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Providers</span>
              </div>
              <div class="p-2 space-y-0.5">
                <button
                  v-for="provider in allProvidersWithModels"
                  :key="`sidebar-${provider.name}`"
                  @click="selectProviderForModels(provider.name)"
                  class="w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between group transition-all duration-200"
                  :class="selectedModelProvider === provider.name 
                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-200' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'"
                >
                  <div class="flex items-center min-w-0">
                    <span
                      class="w-2 h-2 rounded-full mr-3 flex-shrink-0 transition-colors"
                      :class="isProviderConfigured(provider.name) 
                        ? (selectedModelProvider === provider.name ? 'bg-green-500' : 'bg-green-400')
                        : 'bg-gray-300'"
                    ></span>
                    <span class="truncate font-medium text-sm">{{ provider.name }}</span>
                  </div>
                  <div class="flex items-center gap-1 flex-shrink-0 ml-2">
                    <span 
                      class="text-xs py-0.5 px-2 rounded-full transition-colors font-medium border"
                      :class="selectedModelProvider === provider.name
                        ? 'bg-blue-50 text-blue-600 border-blue-100'
                        : 'bg-gray-100 text-gray-400 border-transparent group-hover:bg-white group-hover:border-gray-200'"
                    >
                      {{ provider.totalModels }}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <!-- Right Panel: Models for Selected Provider -->
            <div class="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <!-- Panel Header -->
              <div 
                class="px-5 py-4 border-b flex items-center justify-between bg-white"
              >
                <div class="flex items-center gap-3">
                  <span 
                    class="text-lg font-semibold text-gray-900"
                  >{{ selectedModelProvider }}</span>
                  
                  <span 
                    class="text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1.5"
                    :class="isProviderConfigured(selectedModelProvider) 
                      ? 'bg-green-50 text-green-700 border-green-100' 
                      : 'bg-gray-50 text-gray-500 border-gray-100'"
                  >
                    <span class="w-1.5 h-1.5 rounded-full" :class="isProviderConfigured(selectedModelProvider) ? 'bg-green-500' : 'bg-gray-400'"></span>
                    {{ isProviderConfigured(selectedModelProvider) ? 'Configured' : 'Not Configured' }}
                  </span>
                </div>
              </div>

              <!-- API Key Configuration Section -->
              <div class="px-5 py-4 border-b border-gray-100 bg-white">
                <div class="flex gap-2">
                  <div class="relative flex-1">
                    <input
                      v-model="apiKey"
                      :type="showApiKey ? 'text' : 'password'"
                      class="w-full p-2.5 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      :placeholder="isProviderConfigured(selectedModelProvider) ? 'Enter new key to update...' : 'Enter API key...'"
                    />
                    <button
                      @click="toggleApiKeyVisibility"
                      class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      type="button"
                    >
                      <span v-if="showApiKey" class="i-heroicons-eye-slash-20-solid w-4 h-4"></span>
                      <span v-else class="i-heroicons-eye-20-solid w-4 h-4"></span>
                    </button>
                  </div>
                  <button
                    @click="saveApiKeyForSelectedProvider"
                    :disabled="!apiKey || saving"
                    class="px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center whitespace-nowrap"
                  >
                    <span
                      v-if="saving"
                      class="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"
                    ></span>
                    {{ saving ? 'Saving...' : 'Save Key' }}
                  </button>
                </div>
              </div>

              <!-- Panel Content: Models by Type -->
              <div class="px-5 py-4 bg-gray-50/30 min-h-[300px]">
                
                <div v-if="selectedProviderLlmModels.length > 0 || selectedProviderAudioModels.length > 0 || selectedProviderImageModels.length > 0" class="mb-5">
                  <h3 class="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    Available Models
                    <span class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                      {{ selectedProviderLlmModels.length + selectedProviderAudioModels.length + selectedProviderImageModels.length }}
                    </span>
                  </h3>
                </div>

                <div class="space-y-6">
                  <!-- LLM Models -->
                  <div v-if="selectedProviderLlmModels.length > 0">
                    <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                       <span class="i-heroicons-cube-20-solid w-4 h-4 text-blue-500"></span>
                      LLM Models
                    </h4>
                    <div class="grid grid-cols-1 xl:grid-cols-2 gap-2">
                      <div 
                        v-for="model in selectedProviderLlmModels" 
                        :key="`panel-llm-${model.modelIdentifier}`"
                        class="py-2.5 px-3 bg-white border border-gray-100 hover:border-blue-200 hover:shadow-sm rounded-lg text-sm text-gray-700 transition-all duration-200"
                      >
                        <span class="break-all font-medium text-gray-600">{{ model.modelIdentifier }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Audio Models -->
                  <div v-if="selectedProviderAudioModels.length > 0">
                    <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span class="i-heroicons-speaker-wave-20-solid w-4 h-4 text-purple-500"></span>
                      Audio Models
                    </h4>
                    <div class="grid grid-cols-1 xl:grid-cols-2 gap-2">
                      <div 
                        v-for="model in selectedProviderAudioModels" 
                        :key="`panel-audio-${model.modelIdentifier}`"
                        class="py-2.5 px-3 bg-white border border-gray-100 hover:border-purple-200 hover:shadow-sm rounded-lg text-sm text-gray-700 transition-all duration-200"
                      >
                        <span class="break-all font-medium text-gray-600">{{ model.modelIdentifier }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Image Models -->
                  <div v-if="selectedProviderImageModels.length > 0">
                    <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span class="i-heroicons-photo-20-solid w-4 h-4 text-amber-500"></span>
                      Image Models
                    </h4>
                    <div class="grid grid-cols-1 xl:grid-cols-2 gap-2">
                      <div 
                        v-for="model in selectedProviderImageModels" 
                        :key="`panel-image-${model.modelIdentifier}`"
                        class="py-2.5 px-3 bg-white border border-gray-100 hover:border-amber-200 hover:shadow-sm rounded-lg text-sm text-gray-700 transition-all duration-200"
                      >
                        <span class="break-all font-medium text-gray-600">{{ model.modelIdentifier }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Empty state for selected provider -->
                  <div 
                    v-if="selectedProviderLlmModels.length === 0 && selectedProviderAudioModels.length === 0 && selectedProviderImageModels.length === 0"
                    class="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div class="bg-gray-50 p-4 rounded-full mb-3">
                      <span class="i-heroicons-cube-transparent-20-solid w-8 h-8 text-gray-300"></span>
                    </div>
                    <h4 class="text-gray-900 font-medium mb-1">No Models Found</h4>
                    <p class="text-sm text-gray-500 max-w-xs mx-auto">
                      This provider doesn't have any models available yet. Try checking your API key configuration.
                    </p>
                  </div>
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
