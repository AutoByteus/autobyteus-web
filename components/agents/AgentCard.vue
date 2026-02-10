<template>
  <div class="group bg-white rounded-2xl border border-gray-200 p-5 transition-all duration-200 hover:shadow-lg hover:border-indigo-200">
    <div class="flex w-full flex-col sm:flex-row items-start gap-5">
      <div class="h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-3xl bg-slate-100 flex items-center justify-center">
        <div class="h-full w-full overflow-hidden rounded-[1.2rem] bg-slate-100 flex items-center justify-center">
          <img
            v-if="showAvatarImage"
            :src="avatarUrl"
            :alt="`${agentDef.name} avatar`"
            class="h-full w-full object-cover"
            @error="avatarLoadError = true"
          />
          <span v-else class="text-2xl font-semibold tracking-wide text-slate-600">{{ avatarInitials }}</span>
        </div>
      </div>

      <div class="min-w-0 flex-1 sm:pr-2">
        <h3 class="font-bold text-xl text-gray-900 truncate">{{ agentDef.name }}</h3>

        <div class="mt-4">
          <p class="text-[11px] font-bold text-gray-500 tracking-wider mb-2 uppercase">Tools</p>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="tool in visibleTools" :key="tool" class="px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
              {{ tool }}
            </span>
            <span v-if="remainingToolsCount > 0" class="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full">
              +{{ remainingToolsCount }}
            </span>
            <span v-if="visibleTools.length === 0" class="text-xs text-gray-500 italic">
              None
            </span>
          </div>
        </div>

        <div class="mt-4">
          <p class="text-[11px] font-bold text-gray-500 tracking-wider mb-2 uppercase">Skills</p>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="skill in visibleSkills" :key="skill" class="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
              {{ skill }}
            </span>
            <span v-if="remainingSkillsCount > 0" class="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full">
              +{{ remainingSkillsCount }}
            </span>
            <span v-if="visibleSkills.length === 0" class="text-xs text-gray-500 italic">
              None
            </span>
          </div>
        </div>
      </div>

      <div class="w-full sm:w-auto sm:ml-auto sm:self-stretch flex sm:flex-col items-end justify-start gap-3">
        <button
          @click.stop="$emit('run-agent', agentDef)"
          class="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-md hover:from-indigo-700 hover:to-blue-700 transition-colors"
        >
          Run Agent
        </button>
        <button
          @click.stop="$emit('view-details', agentDef.id)"
          class="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRefs, watch } from 'vue';
import type { AgentDefinition } from '~/stores/agentDefinitionStore';

const props = defineProps<{
  agentDef: AgentDefinition;
}>();

const emit = defineEmits(['view-details', 'run-agent']);

const { agentDef } = toRefs(props);
const avatarLoadError = ref(false);

const MAX_TAGS = 4;

const allSkills = computed(() => agentDef.value.skillNames || []);

const visibleTools = computed(() => (agentDef.value.toolNames || []).slice(0, MAX_TAGS));
const remainingToolsCount = computed(() => Math.max(0, (agentDef.value.toolNames || []).length - MAX_TAGS));

const visibleSkills = computed(() => allSkills.value.slice(0, MAX_TAGS));
const remainingSkillsCount = computed(() => Math.max(0, allSkills.value.length - MAX_TAGS));

watch(() => agentDef.value.avatarUrl, () => {
  avatarLoadError.value = false;
});

const showAvatarImage = computed(() => Boolean(agentDef.value.avatarUrl) && !avatarLoadError.value);
const avatarUrl = computed(() => agentDef.value.avatarUrl || '');

const avatarInitials = computed(() => {
  const raw = agentDef.value.name?.trim() ?? '';
  if (!raw) {
    return 'AI';
  }
  const parts = raw.split(/\s+/).filter(Boolean).slice(0, 2);
  const initials = parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
  return initials || 'AI';
});

</script>
