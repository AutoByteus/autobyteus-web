import { defineStore } from 'pinia';
import { useQuery, useMutation } from '@vue/apollo-composable';
import { GET_TOOLS } from '~/graphql/queries/toolQueries';
import { GET_MCP_SERVERS, PREVIEW_MCP_SERVER_TOOLS } from '~/graphql/queries/mcpServerQueries';
import { CONFIGURE_MCP_SERVER, DELETE_MCP_SERVER } from '~/graphql/mutations/mcpServerMutations';

// --- Interfaces ---

export interface ToolParameter {
  name: string;
  paramType: string;
  description: string;
  required: boolean;
  defaultValue: string | null;
  enumValues: string[] | null;
}

export interface Tool {
  name: string;
  description: string;
  category: 'LOCAL' | 'MCP';
  argumentSchema: {
    parameters: ToolParameter[];
  } | null;
}

export interface McpServer {
  __typename: 'StdioMcpServerConfig' | 'StreamableHttpMcpServerConfig';
  serverId: string;
  transportType: 'STDIO' | 'STREAMABLE_HTTP';
  enabled: boolean;
  toolNamePrefix: string;
  // Stdio
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  // HTTP
  url?: string;
  token?: string;
  headers?: Record<string, string>;
}

interface PreviewResult {
  tools: Tool[];
  isError: boolean;
  message: string;
}

interface ToolManagementState {
  localTools: Tool[];
  mcpServers: McpServer[];
  toolsByServerId: Record<string, Tool[]>;
  loading: boolean;
  error: any;
  previewResult: PreviewResult | null;
}

export const useToolManagementStore = defineStore('toolManagement', {
  state: (): ToolManagementState => ({
    localTools: [],
    mcpServers: [],
    toolsByServerId: {},
    loading: false,
    error: null,
    previewResult: null,
  }),

  getters: {
    getLocalTools: (state): Tool[] => state.localTools,
    getMcpServers: (state): McpServer[] => state.mcpServers,
    getLoading: (state): boolean => state.loading,
    getError: (state): any => state.error,
    getPreviewResult: (state): PreviewResult | null => state.previewResult,

    // Getter that accepts an argument
    getToolsForServer: (state) => {
      return (serverId: string): Tool[] => state.toolsByServerId[serverId] || [];
    },
  },

  actions: {
    async fetchLocalTools() {
      this.loading = true;
      this.error = null;
      try {
        const { onResult, onError } = useQuery(GET_TOOLS, { category: 'LOCAL' }, { fetchPolicy: 'network-only' });
        
        return new Promise<void>((resolve, reject) => {
          onResult(result => {
            if (result.data) {
              this.localTools = result.data.tools;
            }
            this.loading = false;
            resolve();
          });
          onError(err => {
            this.error = err;
            this.loading = false;
            console.error("Failed to fetch local tools:", err);
            reject(err);
          });
        });
      } catch (e) {
        this.error = e;
        this.loading = false;
        throw e;
      }
    },

    async fetchMcpServers() {
      this.loading = true;
      this.error = null;
      try {
        const { onResult, onError } = useQuery(GET_MCP_SERVERS, null, { fetchPolicy: 'network-only' });
        
        return new Promise<void>((resolve, reject) => {
          onResult(result => {
            if (result.data) {
              this.mcpServers = result.data.mcpServers;
            }
            this.loading = false;
            resolve();
          });
          onError(err => {
            this.error = err;
            this.loading = false;
            console.error("Failed to fetch MCP servers:", err);
            reject(err);
          });
        });
      } catch (e) {
        this.error = e;
        this.loading = false;
        throw e;
      }
    },

    async fetchToolsForServer(serverId: string) {
      this.loading = true;
      this.error = null;
      try {
        const { onResult, onError } = useQuery(GET_TOOLS, { sourceServerId: serverId }, { fetchPolicy: 'network-only' });
        
        return new Promise<void>((resolve, reject) => {
          onResult(result => {
            if (result.data) {
              // Use Vue's $patch for reactive updates to nested properties
              this.$patch(state => {
                state.toolsByServerId[serverId] = result.data.tools;
              });
            }
            this.loading = false;
            resolve();
          });
          onError(err => {
            this.error = err;
            this.loading = false;
            console.error(`Failed to fetch tools for server ${serverId}:`, err);
            reject(err);
          });
        });
      } catch (e) {
        this.error = e;
        this.loading = false;
        throw e;
      }
    },
    
    async previewMcpServer(input: any) {
        this.loading = true;
        this.previewResult = null;
        this.error = null;
        try {
            const { onResult, onError } = useQuery(PREVIEW_MCP_SERVER_TOOLS, { input }, { fetchPolicy: 'network-only' });
            return new Promise<void>((resolve, reject) => {
                onResult(result => {
                    if (result.data) {
                        this.previewResult = {
                            tools: result.data.previewMcpServerTools,
                            isError: false,
                            message: ''
                        };
                    }
                    this.loading = false;
                    resolve();
                });
                onError(err => {
                    this.error = err;
                    this.previewResult = {
                        tools: [],
                        isError: true,
                        message: err.graphQLErrors[0]?.message || 'An unknown error occurred.'
                    };
                    this.loading = false;
                    reject(err);
                });
            });
        } catch(e) {
            this.error = e;
            this.loading = false;
            throw e;
        }
    },
    
    async configureMcpServer(input: any) {
        this.loading = true;
        this.error = null;
        try {
            const { mutate } = useMutation(CONFIGURE_MCP_SERVER);
            const response = await mutate({ input });
            if (response?.data?.configureMcpServer) {
                await this.fetchMcpServers();
                return response.data.configureMcpServer;
            }
            throw new Error('Failed to configure MCP server: No data returned');
        } catch (e) {
            this.error = e;
            throw e;
        } finally {
            this.loading = false;
        }
    },

    async deleteMcpServer(serverId: string) {
      this.loading = true;
      this.error = null;
      try {
        const { mutate } = useMutation(DELETE_MCP_SERVER);
        const response = await mutate({ serverId });
        
        if (response?.data?.deleteMcpServer) {
          // Refetch the server list on successful deletion
          if (response.data.deleteMcpServer.success) {
            await this.fetchMcpServers();
          }
          return response.data.deleteMcpServer;
        }
        throw new Error('Failed to delete MCP server: No data returned');
      } catch (e) {
        this.error = e;
        throw e;
      } finally {
        this.loading = false;
      }
    },

    clearError() {
      this.error = null;
    },
    
    clearPreviewResult() {
        this.previewResult = null;
    }
  },
});
