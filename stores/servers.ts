import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export type ServerStatus = 'connected' | 'disconnected' | 'error';

export interface Server {
  id: string;
  type: 'mcp' | 'agent';
  name: string;
  url: string;
  apiKey?: string;
  status: ServerStatus;
}

export const useServersStore = defineStore('servers', () => {
  // State
  const servers = ref<Server[]>([
    // Sample data for demonstration
    {
      id: '1',
      type: 'mcp',
      name: 'Default MCP Server',
      url: 'https://mcp.example.com',
      status: 'connected'
    },
    {
      id: '2',
      type: 'agent',
      name: 'Default Agent Server',
      url: 'https://agent.example.com',
      status: 'connected'
    }
  ]);

  // Getters
  const mcpServers = computed(() => 
    servers.value.filter(server => server.type === 'mcp')
  );
  
  const agentServers = computed(() => 
    servers.value.filter(server => server.type === 'agent')
  );

  // Actions
  const addServer = (server: Server) => {
    servers.value.push(server);
  };

  const updateServer = (updatedServer: Server) => {
    const index = servers.value.findIndex(s => s.id === updatedServer.id);
    if (index !== -1) {
      servers.value[index] = updatedServer;
    }
  };

  const deleteServer = (serverId: string) => {
    servers.value = servers.value.filter(s => s.id !== serverId);
  };

  const toggleServerStatus = (serverId: string) => {
    const server = servers.value.find(s => s.id === serverId);
    if (server) {
      server.status = server.status === 'connected' ? 'disconnected' : 'connected';
    }
  };

  return {
    servers,
    mcpServers,
    agentServers,
    addServer,
    updateServer,
    deleteServer,
    toggleServerStatus
  };
});
