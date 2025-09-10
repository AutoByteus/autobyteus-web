<template>
  <div class="bg-gray-50 rounded-lg border border-gray-200 p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:border-gray-300">
    <div>
      <h3 class="font-semibold text-base text-gray-800">{{ agentDef.name }}</h3>
      <p class="text-sm text-gray-600 mt-1 h-10 line-clamp-2">{{ agentDef.description }}</p>

      <div class="mt-4">
        <p class="text-xs font-bold text-gray-500 uppercase tracking-wider">Role</p>
        <p class="text-sm text-gray-700 font-medium">{{ agentDef.role }}</p>
      </div>

      <div class="mt-4">
        <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tools Required (Libraries)</p>
        <div class="flex flex-wrap gap-1.5">
          <span v-for="tool in visibleTools" :key="tool" class="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            {{ tool }}
          </span>
          <span v-if="remainingToolsCount > 0" class="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
            +{{ remainingToolsCount }} more
          </span>
           <span v-if="visibleTools.length === 0" class="text-xs text-gray-500 italic">
            None
          </span>
        </div>
      </div>

      <div class="mt-4">
        <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Skills</p>
        <div class="flex flex-wrap gap-1.5">
          <span v-for="skill in visibleSkills" :key="skill" class="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            {{ skill }}
          </span>
          <span v-if="remainingSkillsCount > 0" class="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
            +{{ remainingSkillsCount }} more
          </span>
           <span v-if="visibleSkills.length === 0" class="text-xs text-gray-500 italic">
            None
          </span>
        </div>
      </div>
    </div>

    <div class="mt-6 flex items-center justify-end space-x-3 border-t border-gray-200 pt-4">
      <button @click.stop="$emit('view-details', agentDef.id)" class="px-3 py-1.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors">
        View Details
      </button>      
      <button @click.stop="$emit('run-agent', agentDef)" class="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
        Run Agent
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue';
import type { AgentDefinition } from '~/stores/agentDefinitionStore';

const props = defineProps<{
  agentDef: AgentDefinition;
}>();

const emit = defineEmits(['view-details', 'run-agent']);

const { agentDef } = toRefs(props);

const MAX_TAGS = 3;

const allSkills = computed(() => [
  ...(agentDef.value.inputProcessorNames || []),
  ...(agentDef.value.llmResponseProcessorNames || []),
  ...(agentDef.value.systemPromptProcessorNames || []),
  ...(agentDef.value.toolExecutionResultProcessorNames || []),
  ...(agentDef.value.phaseHookNames || []),
]);

const visibleTools = computed(() => (agentDef.value.toolNames || []).slice(0, MAX_TAGS));
const remainingToolsCount = computed(() => Math.max(0, (agentDef.value.toolNames || []).length - MAX_TAGS));

const visibleSkills = computed(() => allSkills.value.slice(0, MAX_TAGS));
const remainingSkillsCount = computed(() => Math.max(0, allSkills.value.length - MAX_TAGS));
</script>
