<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-60 backdrop-blur-sm" @click.self="handleCancel">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 transform transition-all" role="dialog" aria-modal="true">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg leading-6 font-medium text-gray-900">Reactivate Launch Profile</h3>
          <p class="mt-1 text-sm text-gray-500">Choose how to reactivate the profile for agent: <span class="font-semibold">{{ launchProfile?.agentDefinition.name }}</span></p>
        </div>

        <!-- Body -->
        <div class="px-6 py-5">
          <div class="space-y-4">
            
            <!-- Option: Re-create Workspace -->
            <div
              @click="selectedOption = 'recreate'"
              :class="['p-4 border-2 rounded-lg cursor-pointer transition-all', selectedOption === 'recreate' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-white hover:border-gray-400']"
            >
              <!-- UPDATED: Removed icon and flex classes for left alignment -->
              <h4 class="font-semibold text-gray-800">
                Re-create Workspace
              </h4>
              <p class="text-sm text-gray-600 mt-2">Create a new workspace based on the profile's saved configuration.</p>
              
              <div v-if="selectedOption === 'recreate' && launchProfile" class="mt-4 space-y-3 text-sm">
                <div>
                  <h5 class="font-semibold text-gray-700">Workspace Type</h5>
                  <p class="text-gray-600 font-mono pl-1">{{ launchProfile.workspaceTypeName }}</p>
                </div>
                <div v-if="Object.keys(launchProfile.workspaceConfig || {}).length > 0">
                  <h5 class="font-semibold text-gray-700">Configuration</h5>
                  <div class="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md space-y-1 text-xs">
                    <div v-for="(value, key) in launchProfile.workspaceConfig" :key="key" class="flex">
                      <span class="text-gray-500 mr-2">{{ key }}:</span>
                      <span class="font-mono text-gray-800 truncate" :title="String(value)">{{ value }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Option: Attach to Existing -->
            <div
              :class="[
                'p-4 border-2 rounded-lg transition-all', 
                selectedOption === 'attach' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-white',
                isAttachDisabled ? 'cursor-not-allowed bg-gray-100 opacity-60' : 'cursor-pointer hover:border-gray-400'
              ]"
              @click="!isAttachDisabled && (selectedOption = 'attach')"
            >
              <!-- UPDATED: Removed icon and flex classes for left alignment -->
              <h4 class="font-semibold text-gray-800">
                Attach to Existing
              </h4>
              <p class="text-sm text-gray-600 mt-2">Link this profile to a currently active workspace.</p>
              
              <div v-if="isAttachDisabled" class="mt-2 text-sm text-gray-500 italic">No active workspaces available.</div>

              <!-- Workspace Cards List -->
              <div v-if="selectedOption === 'attach' && !isAttachDisabled" class="mt-4 space-y-3 max-h-[22rem] overflow-y-auto pr-2">
                <label v-for="ws in activeWorkspaces" :key="ws.workspaceId"
                  :class="[
                    'p-3 border rounded-lg cursor-pointer transition-all flex items-start space-x-3', 
                    selectedWorkspaceId === ws.workspaceId 
                      ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500' 
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  ]"
                >
                  <input 
                    type="radio" 
                    :value="ws.workspaceId" 
                    v-model="selectedWorkspaceId" 
                    class="mt-1 form-radio h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" 
                    @click.stop 
                  />
                  <div class="flex-1">
                    <div class="flex justify-between items-center">
                      <span class="font-semibold text-gray-800">{{ ws.name }}</span>
                      <span v-if="ws.workspaceId === recommendedWorkspaceId" class="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Recommended
                      </span>
                    </div>
                    <p class="text-sm text-gray-500 font-mono">{{ ws.workspaceTypeName }}</p>
                    <div v-if="Object.keys(ws.workspaceConfig || {}).length > 0" class="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700 space-y-1">
                      <div v-for="(value, key) in ws.workspaceConfig" :key="key" class="flex">
                        <span class="font-medium mr-1">{{ key }}:</span>
                        <span class="font-mono truncate" :title="String(value)">{{ value }}</span>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 px-6 py-3 sm:flex sm:flex-row-reverse">
          <button 
            type="button"
            @click="handleConfirm"
            :disabled="isConfirmDisabled"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm
          </button>
          <button 
            type="button" 
            @click="handleCancel"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useWorkspaceStore } from '~/stores/workspace';
import type { AgentLaunchProfile } from '~/stores/agentLaunchProfileStore';
import type { WorkspaceInfo } from '~/stores/workspace';

const props = defineProps<{  show: boolean;
  launchProfile: AgentLaunchProfile | null; // Renamed from session
}>();

const emit = defineEmits<{  (e: 'cancel'): void;
  (e: 'confirm', payload: { choice: 'recreate' | 'attach', workspaceId?: string }): void;
}>();

const workspaceStore = useWorkspaceStore();

const selectedOption = ref<'recreate' | 'attach'>('recreate');
const selectedWorkspaceId = ref<string>('');

const activeWorkspaces = computed<WorkspaceInfo[]>(() => workspaceStore.allWorkspaces);
const isAttachDisabled = computed(() => activeWorkspaces.value.length === 0);

// Utility for deep object comparison
const configsAreEqual = (obj1: any, obj2: any): boolean => {
  if (!obj1 || !obj2) return false;
  try {
    // Sorting keys is not perfect but handles simple cases where key order differs.
    // For a truly robust solution, a library like lodash.isEqual would be better.
    const stringify = (o: any) => JSON.stringify(o, (key, value) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return Object.keys(value)
          .sort()
          .reduce((sorted, key) => {
            sorted[key] = value[key];
            return sorted;
          }, {} as Record<string, any>);
      }
      return value;
    });
    return stringify(obj1) === stringify(obj2);
  } catch (e) {
    return false;
  }
};

const recommendedWorkspaceId = computed(() => {
    if (!props.launchProfile?.workspaceConfig || activeWorkspaces.value.length === 0) {
        return null;
    }
    const profileConfig = props.launchProfile.workspaceConfig;
    const matchingWorkspace = activeWorkspaces.value.find(ws => 
        configsAreEqual(ws.workspaceConfig, profileConfig)
    );
    return matchingWorkspace ? matchingWorkspace.workspaceId : null;
});

const isConfirmDisabled = computed(() => {
  if (selectedOption.value === 'attach') {
    return !selectedWorkspaceId.value;
  }
  // 'recreate' is always a valid choice if selected
  return false;
});

// Watcher to set smart defaults when dialog is opened
watch(() => props.show, (newVal) => {
  if (newVal) {
    if (isAttachDisabled.value) {
      selectedOption.value = 'recreate';
      selectedWorkspaceId.value = '';
    } else {
      selectedOption.value = 'attach';
      if (recommendedWorkspaceId.value) {
        selectedWorkspaceId.value = recommendedWorkspaceId.value;
      } else if (activeWorkspaces.value.length > 0) {
        selectedWorkspaceId.value = activeWorkspaces.value.workspaceId;
      } else {
        selectedWorkspaceId.value = '';
      }
    }
  }
});

const handleConfirm = () => {
  if (isConfirmDisabled.value) return;
  emit('confirm', {
    choice: selectedOption.value,
    workspaceId: selectedWorkspaceId.value || undefined,
  });
};

const handleCancel = () => {
  emit('cancel');
};
</script>
