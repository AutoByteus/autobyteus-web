import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useServersStore } from './servers';

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon?: string;
  isRemote: boolean;
  serverId?: string;
  serverName?: string;
}

export const useAgentsStore = defineStore('agents', () => {
  // State
  const agents = ref<Agent[]>([
    // Local agents
    {
      id: 'code-assistant',
      name: 'Code Assistant',
      description: 'Helps with coding tasks and problem-solving',
      icon: 'i-heroicons-code-bracket-20-solid',
      isRemote: false
    },
    {
      id: 'data-analyzer',
      name: 'Data Analyzer',
      description: 'Analyzes data and provides insights',
      icon: 'i-heroicons-chart-bar-20-solid',
      isRemote: false
    },
    
    // Remote agents (example)
    {
      id: 'remote-1',
      name: 'Documentation Generator',
      description: 'Automatically generates documentation from code',
      icon: 'i-heroicons-document-text-20-solid',
      isRemote: true,
      serverId: '2',
      serverName: 'Default Agent Server'
    },
    {
      id: 'remote-2',
      name: 'Test Case Generator',
      description: 'Creates test cases for your application',
      icon: 'i-heroicons-beaker-20-solid',
      isRemote: true,
      serverId: '2',
      serverName: 'Default Agent Server'
    }
  ]);

  // Getters
  const localAgents = computed(() => 
    agents.value.filter(agent => !agent.isRemote)
  );
  
  const remoteAgents = computed(() => 
    agents.value.filter(agent => agent.isRemote)
  );
  
  const getAgentsByServerId = (serverId: string) => 
    agents.value.filter(agent => agent.serverId === serverId);

  // Actions
  const addAgent = (agent: Agent) => {
    agents.value.push(agent);
  };

  const updateAgent = (updatedAgent: Agent) => {
    const index = agents.value.findIndex(a => a.id === updatedAgent.id);
    if (index !== -1) {
      agents.value[index] = updatedAgent;
    }
  };

  const deleteAgent = (agentId: string) => {
    agents.value = agents.value.filter(a => a.id !== agentId);
  };

  // Handle server deletion
  const serversStore = useServersStore();
  const deleteAgentsByServerId = (serverId: string) => {
    agents.value = agents.value.filter(a => a.serverId !== serverId);
  };

  return {
    agents,
    localAgents,
    remoteAgents,
    getAgentsByServerId,
    addAgent,
    updateAgent,
    deleteAgent,
    deleteAgentsByServerId
  };
});
