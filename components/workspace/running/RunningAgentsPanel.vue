<template>
  <div class="flex flex-col h-full bg-white">
    <div class="flex-1 overflow-y-auto border-t border-gray-200">
      <div v-if="agentGroups.length === 0 && teamGroups.length === 0" class="p-6 text-center text-sm text-gray-500">
        No agents or teams running.
      </div>

      <div v-if="agentGroups.length > 0">
        <div>
          <RunningAgentGroup
            v-for="group in agentGroups"
            :key="group.definitionId"
            :definition-id="group.definitionId"
            :definition-name="group.definitionName"
            :instances="group.instances"
            :selected-instance-id="selectedAgentId"
            @create="createAgentInstance"
            @select="selectAgentInstance"
            @delete="deleteAgentInstance"
          />
        </div>
      </div>

      <div v-if="teamGroups.length > 0">
        <div v-if="agentGroups.length > 0" class="mx-3 border-t border-gray-100"></div>
        <div>
          <RunningTeamGroup
            v-for="group in teamGroups"
            :key="group.definitionId"
            :definition-id="group.definitionId"
            :definition-name="group.definitionName"
            :instances="group.instances"
            :selected-instance-id="selectedTeamId"
            :coordinator-name="getCoordinatorName(group.definitionId)"
            @create="createTeamInstance"
            @select="selectTeamInstance"
            @delete="deleteTeamInstance"
            @select-member="selectTeamMember"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useAgentContextsStore } from '~/stores/agentContextsStore';
import { useAgentTeamContextsStore } from '~/stores/agentTeamContextsStore';
import { useAgentDefinitionStore } from '~/stores/agentDefinitionStore';
import { useAgentTeamDefinitionStore } from '~/stores/agentTeamDefinitionStore';
import { useAgentRunConfigStore } from '~/stores/agentRunConfigStore';
import { useTeamRunConfigStore } from '~/stores/teamRunConfigStore';
import { useAgentSelectionStore } from '~/stores/agentSelectionStore';
import { useAgentRunStore } from '~/stores/agentRunStore';
import { useAgentTeamRunStore } from '~/stores/agentTeamRunStore';
import type { AgentTeamContext } from '~/types/agent/AgentTeamContext';
import RunningAgentGroup from './RunningAgentGroup.vue';
import RunningTeamGroup from './RunningTeamGroup.vue';

const emit = defineEmits<{
  (e: 'instance-selected', payload: { type: 'agent' | 'team'; instanceId: string }): void;
  (e: 'instance-created', payload: { type: 'agent' | 'team'; definitionId: string }): void;
}>();

const agentContextsStore = useAgentContextsStore();
const teamContextsStore = useAgentTeamContextsStore();
const agentDefinitionStore = useAgentDefinitionStore();
const teamDefinitionStore = useAgentTeamDefinitionStore();
const agentRunConfigStore = useAgentRunConfigStore();
const teamRunConfigStore = useTeamRunConfigStore();
const selectionStore = useAgentSelectionStore();
const agentRunStore = useAgentRunStore();
const teamRunStore = useAgentTeamRunStore();

const selectedAgentId = computed(() => selectionStore.selectedType === 'agent' ? selectionStore.selectedInstanceId : null);
const selectedTeamId = computed(() => selectionStore.selectedType === 'team' ? selectionStore.selectedInstanceId : null);

const agentGroups = computed(() => {
  return Array.from(agentContextsStore.instancesByDefinition.entries()).map(([definitionId, instances]) => ({
    definitionId,
    definitionName: instances[0]?.config.agentDefinitionName || 'Agent',
    instances,
  }));
});



const teamGroups = computed(() => {
  const grouped = new Map<string, AgentTeamContext[]>();
  for (const team of teamContextsStore.allTeamInstances) {
    const defId = team.config.teamDefinitionId;
    if (!grouped.has(defId)) grouped.set(defId, []);
    grouped.get(defId)!.push(team);
  }
  return Array.from(grouped.entries()).map(([definitionId, instances]) => ({
    definitionId,
    definitionName: instances[0]?.config.teamDefinitionName || 'Team',
    instances,
  }));
});

onMounted(() => {
  if (agentDefinitionStore.agentDefinitions.length === 0) {
    agentDefinitionStore.fetchAllAgentDefinitions();
  }
  if (teamDefinitionStore.agentTeamDefinitions.length === 0) {
    teamDefinitionStore.fetchAllAgentTeamDefinitions();
  }
});

const createAgentInstance = (definitionId: string) => {
  const definition = agentDefinitionStore.getAgentDefinitionById(definitionId);
  if (!definition) return;

  const group = agentGroups.value.find(g => g.definitionId === definitionId);
  if (group?.instances.length) {
    const template = { ...group.instances[0].config, isLocked: false };
    agentRunConfigStore.setAgentConfig(template);
  } else {
    agentRunConfigStore.setTemplate(definition);
  }

  teamRunConfigStore.clearConfig();
  selectionStore.clearSelection();
  agentContextsStore.createInstanceFromTemplate();
  emit('instance-created', { type: 'agent', definitionId });
};

const createTeamInstance = (definitionId: string) => {
  const definition = teamDefinitionStore.getAgentTeamDefinitionById(definitionId);
  if (!definition) return;

  const group = teamGroups.value.find(g => g.definitionId === definitionId);
  if (group?.instances.length) {
    const template = JSON.parse(JSON.stringify(group.instances[0].config));
    template.isLocked = false;
    teamRunConfigStore.setConfig(template);
  } else {
    teamRunConfigStore.setTemplate(definition);
  }

  agentRunConfigStore.clearConfig();
  selectionStore.clearSelection();
  teamContextsStore.createInstanceFromTemplate();
  emit('instance-created', { type: 'team', definitionId });
};

const selectAgentInstance = (instanceId: string) => {
  selectionStore.selectInstance(instanceId, 'agent');
  emit('instance-selected', { type: 'agent', instanceId });
};

const selectTeamInstance = (instanceId: string) => {
  selectionStore.selectInstance(instanceId, 'team');
  emit('instance-selected', { type: 'team', instanceId });
};

const selectTeamMember = (teamId: string, memberName: string) => {
  // First ensure the team is selected
  selectionStore.selectInstance(teamId, 'team');
  // Then focus the member
  teamContextsStore.setFocusedMember(memberName);
  emit('instance-selected', { type: 'team', instanceId: teamId });
};

const getCoordinatorName = (definitionId: string): string | undefined => {
  return teamDefinitionStore.getAgentTeamDefinitionById(definitionId)?.coordinatorMemberName;
};

const deleteAgentInstance = async (instanceId: string) => {
  await agentRunStore.closeAgent(instanceId, { terminate: true });
};

const deleteTeamInstance = async (instanceId: string) => {
  await teamRunStore.terminateTeamInstance(instanceId);
};
</script>
