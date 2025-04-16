import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useServersStore } from './servers';

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon?: string;
  isRemote: boolean;
  serverId?: string;
  serverName?: string;
}

export const useToolsStore = defineStore('tools', () => {
  // State
  const tools = ref<Tool[]>([
    // Local tools
    {
      id: 'token-counter',
      name: 'Token Counter',
      description: 'Count tokens for various LLM models',
      icon: 'i-heroicons-calculator-20-solid',
      isRemote: false
    },
    {
      id: 'prompt-optimizer',
      name: 'Prompt Optimizer',
      description: 'Optimize your prompts for better results',
      icon: 'i-heroicons-sparkles-20-solid',
      isRemote: false
    },
    
    // Remote tools (example)
    {
      id: 'remote-1',
      name: 'Code Analyzer',
      description: 'Analyze code for bugs and improvements',
      icon: 'i-heroicons-code-bracket-20-solid',
      isRemote: true,
      serverId: '1',
      serverName: 'Default MCP Server'
    },
    {
      id: 'remote-2',
      name: 'Data Visualizer',
      description: 'Create visualizations from your data',
      icon: 'i-heroicons-chart-bar-20-solid',
      isRemote: true,
      serverId: '1',
      serverName: 'Default MCP Server'
    }
  ]);

  // Getters
  const localTools = computed(() => 
    tools.value.filter(tool => !tool.isRemote)
  );
  
  const remoteTools = computed(() => 
    tools.value.filter(tool => tool.isRemote)
  );
  
  const getToolsByServerId = (serverId: string) => 
    tools.value.filter(tool => tool.serverId === serverId);

  // Actions
  const addTool = (tool: Tool) => {
    tools.value.push(tool);
  };

  const updateTool = (updatedTool: Tool) => {
    const index = tools.value.findIndex(t => t.id === updatedTool.id);
    if (index !== -1) {
      tools.value[index] = updatedTool;
    }
  };

  const deleteTool = (toolId: string) => {
    tools.value = tools.value.filter(t => t.id !== toolId);
  };

  // Handle server deletion
  const serversStore = useServersStore();
  const deleteToolsByServerId = (serverId: string) => {
    tools.value = tools.value.filter(t => t.serverId !== serverId);
  };

  return {
    tools,
    localTools,
    remoteTools,
    getToolsByServerId,
    addTool,
    updateTool,
    deleteTool,
    deleteToolsByServerId
  };
});
