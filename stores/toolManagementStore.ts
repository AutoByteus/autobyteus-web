import { defineStore } from 'pinia';
import { useMutation, useApolloClient } from '@vue/apollo-composable';
import { GET_TOOLS, GET_TOOLS_GROUPED_BY_CATEGORY } from '~/graphql/queries/toolQueries';
import { GET_MCP_SERVERS, PREVIEW_MCP_SERVER_TOOLS } from '~/graphql/queries/mcpServerQueries';
import { 
  CONFIGURE_MCP_SERVER, 
  DELETE_MCP_SERVER,
  DISCOVER_AND_REGISTER_MCP_SERVER_TOOLS,
  IMPORT_MCP_SERVER_CONFIGS
} from '~/graphql/mutations/mcpServerMutations';
import type {
  GetToolsQuery,
  GetToolsQueryVariables,
  GetToolsGroupedByCategoryQuery,
  GetToolsGroupedByCategoryQueryVariables,
  GetMcpServersQuery,
  PreviewMcpServerToolsQuery,
  PreviewMcpServerToolsQueryVariables,
} from '~/generated/graphql';

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
  origin: 'LOCAL' | 'MCP';
  category: string;
  argumentSchema: {
    parameters: ToolParameter[];
  } | null;
}

export interface ToolCategoryGroup {
  categoryName: string;
  tools: Tool[];
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
  localToolsByCategory: ToolCategoryGroup[];
  mcpServers: McpServer[];
  toolsByServerId: Record<string, Tool[]>;
  loading: boolean;
  error: any;
  previewResult: PreviewResult | null;
}

export const useToolManagementStore = defineStore('toolManagement', {
  state: (): ToolManagementState => ({
    localTools: [],
    localToolsByCategory: [],
    mcpServers: [],
    toolsByServerId: {},
    loading: false,
    error: null,
    previewResult: null,
  }),

  getters: {
    getLocalTools: (state): Tool[] => state.localTools,
    getLocalToolsByCategory: (state): ToolCategoryGroup[] => state.localToolsByCategory,
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
      // This now delegates to the grouped fetcher to ensure data consistency
      return this.fetchLocalToolsGroupedByCategory();
    },

    async fetchLocalToolsGroupedByCategory() {
      this.loading = true;
      this.error = null;
      try {
        const { client } = useApolloClient();
        const { data, errors } = await client.query<GetToolsGroupedByCategoryQuery, GetToolsGroupedByCategoryQueryVariables>({
          query: GET_TOOLS_GROUPED_BY_CATEGORY,
          variables: { origin: 'LOCAL' },
          fetchPolicy: 'network-only',
        });

        if (errors && errors.length > 0) {
          throw new Error(errors.map(e => e.message).join(', '));
        }

        const groups = (data?.toolsGroupedByCategory ?? []) as ToolCategoryGroup[];
        this.localToolsByCategory = groups;
        this.localTools = groups.flatMap(group => group.tools);
      } catch (e) {
        this.error = e;
        console.error("Failed to fetch grouped local tools:", e);
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async fetchMcpServers() {
      this.loading = true;
      this.error = null;
      try {
        const { client } = useApolloClient();
        const { data, errors } = await client.query<GetMcpServersQuery>({
          query: GET_MCP_SERVERS,
          fetchPolicy: 'network-only',
        });

        if (errors && errors.length > 0) {
          throw new Error(errors.map(e => e.message).join(', '));
        }

        const servers = (data?.mcpServers ?? []) as McpServer[];
        this.mcpServers = servers;
      } catch (e) {
        this.error = e;
        console.error("Failed to fetch MCP servers:", e);
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async fetchToolsForServer(serverId: string) {
      this.loading = true;
      this.error = null;
      try {
        const { client } = useApolloClient();
        const { data, errors } = await client.query<GetToolsQuery, GetToolsQueryVariables>({
          query: GET_TOOLS,
          variables: { sourceServerId: serverId },
          fetchPolicy: 'network-only',
        });

        if (errors && errors.length > 0) {
          throw new Error(errors.map(e => e.message).join(', '));
        }

        const tools = (data?.tools ?? []) as Tool[];
        // Use Vue's $patch for reactive updates to nested properties
        this.$patch(state => {
          state.toolsByServerId[serverId] = tools;
        });
      } catch (e) {
        this.error = e;
        console.error(`Failed to fetch tools for server ${serverId}:`, e);
        throw e;
      } finally {
        this.loading = false;
      }
    },
    
    async previewMcpServer(input: any) {
        this.loading = true;
        this.previewResult = null;
        this.error = null;
        try {
            const { client } = useApolloClient();
            const { data, errors } = await client.query<PreviewMcpServerToolsQuery, PreviewMcpServerToolsQueryVariables>({
                query: PREVIEW_MCP_SERVER_TOOLS,
                variables: { input },
                fetchPolicy: 'network-only',
            });

            if (errors && errors.length > 0) {
                const message = errors.map(e => e.message).join(', ');
                throw new Error(message);
            }

            this.previewResult = {
                tools: (data?.previewMcpServerTools ?? []) as Tool[],
                isError: false,
                message: ''
            };
        } catch(e) {
            this.error = e;
            const graphQlMessage = (e as any)?.graphQLErrors?.[0]?.message;
            this.previewResult = {
                tools: [],
                isError: true,
                message: graphQlMessage || (e instanceof Error ? e.message : 'An unknown error occurred.')
            };
            throw e;
        } finally {
            this.loading = false;
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
                // We no longer expect discovered_tools here
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

    async discoverAndRegisterMcpServerTools(serverId: string) {
      this.loading = true;
      this.error = null;
      try {
        const { mutate } = useMutation(DISCOVER_AND_REGISTER_MCP_SERVER_TOOLS);
        const response = await mutate({ serverId });
        if (response?.data?.discoverAndRegisterMcpServerTools) {
          if (response.data.discoverAndRegisterMcpServerTools.success) {
            // On success, refresh the tools for this server
            await this.fetchToolsForServer(serverId);
          }
          // Return the full result so the UI can show messages
          return response.data.discoverAndRegisterMcpServerTools;
        }
        throw new Error('Failed to discover tools: No data returned');
      } catch (e) {
        this.error = e;
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async importMcpServerConfigs(jsonString: string) {
      this.loading = true;
      this.error = null;
      try {
        const { mutate } = useMutation(IMPORT_MCP_SERVER_CONFIGS);
        const response = await mutate({ jsonString });
        if (response?.data?.importMcpServerConfigs) {
          // Refresh the list of servers if at least one was successfully imported.
          if (response.data.importMcpServerConfigs.imported_count > 0) {
            await this.fetchMcpServers();
          }
          return response.data.importMcpServerConfigs;
        }
        throw new Error('Failed to import configs: No data returned');
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
