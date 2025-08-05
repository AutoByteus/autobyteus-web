<template>
  <div class="bg-gray-50 rounded-lg border border-gray-200 p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:border-gray-300">
    <div>
      <h3 class="font-semibold text-base text-gray-800">{{ teamDef.name }}</h3>
      <p class="text-sm text-gray-600 mt-1 h-10 line-clamp-2">{{ teamDef.description }}</p>

      <div class="mt-4">
        <p class="text-xs font-bold text-gray-500 uppercase tracking-wider">Role</p>
        <p class="text-sm text-gray-700 font-medium">{{ teamDef.role || 'Not specified' }}</p>
      </div>

      <div class="mt-4">
        <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Members</p>
        <div class="flex items-center">
          <div class="flex -space-x-2">
            <div v-for="node in teamDef.nodes.slice(0, 5)" :key="node.memberName"
                 :class="[
                   'w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold',
                   node.referenceType === 'AGENT' ? 'bg-blue-200 text-blue-800' : 'bg-purple-200 text-purple-800'
                 ]"
                 :title="`${node.memberName} (${node.referenceType})`">
              {{ node.memberName.substring(0, 1).toUpperCase() }}
            </div>
          </div>
          <span v-if="teamDef.nodes.length > 5" class="ml-3 text-sm text-gray-500">+{{ teamDef.nodes.length - 5 }} more</span>
          <span v-if="teamDef.nodes.length === 0" class="text-sm text-gray-500 italic">No members defined</span>
        </div>
      </div>
    </div>

    <div class="mt-6 flex items-center justify-end space-x-3 border-t border-gray-200 pt-4">
      <button @click.stop="$emit('view-details', teamDef.id)" class="px-3 py-1.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors">
        View Details
      </button>
      <button @click.stop="$emit('run-team', teamDef)" class="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
        Run Team
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AgentTeamDefinition } from '~/stores/agentTeamDefinitionStore';

defineProps<{  teamDef: AgentTeamDefinition;
}>();

defineEmits(['view-details', 'run-team']);
</script>
