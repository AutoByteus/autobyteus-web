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
  // New fields for enhanced tool information
  compatibleModels?: string[];
  dependencies?: string[];
  endpoint?: string;
  authType?: string;
  providerName?: string;
  authConfigured?: boolean;
  schema?: {
    name: string;
    description: string;
    parameters?: {
      type: string;
      properties: Record<string, any>;
      required?: string[];
    };
  };
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
      isRemote: false,
      compatibleModels: ['gpt-3.5-turbo', 'gpt-4', 'claude-3-opus', 'claude-3-sonnet'],
      dependencies: ['tiktoken', 'anthropic-tokenizer'],
      schema: {
        name: 'countTokens',
        description: 'Count tokens in text for different LLM models',
        parameters: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'The text to count tokens for',
              title: 'Input Text'
            },
            model: {
              type: 'string',
              description: 'The model to use for counting tokens',
              enum: ['gpt-3.5-turbo', 'gpt-4', 'claude-3-opus', 'claude-3-sonnet'],
              default: 'gpt-4',
              title: 'Model'
            }
          },
          required: ['text']
        }
      }
    },
    {
      id: 'prompt-optimizer',
      name: 'Prompt Optimizer',
      description: 'Optimize your prompts for better results',
      icon: 'i-heroicons-sparkles-20-solid',
      isRemote: false,
      compatibleModels: ['gpt-4', 'claude-3-opus'],
      dependencies: ['openai', 'anthropic'],
      schema: {
        name: 'optimizePrompt',
        description: 'Optimize a prompt for better results with LLMs',
        parameters: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'The prompt to optimize',
              title: 'Input Prompt'
            },
            model: {
              type: 'string',
              description: 'The model to optimize for',
              enum: ['gpt-3.5-turbo', 'gpt-4', 'claude-3-opus', 'claude-3-sonnet'],
              default: 'gpt-4',
              title: 'Target Model'
            },
            temperature: {
              type: 'number',
              description: 'The temperature to use for optimization (0.0 to 1.0)',
              default: 0.7,
              title: 'Temperature'
            },
            maxTokens: {
              type: 'integer',
              description: 'Maximum tokens in the optimized prompt',
              default: 2000,
              title: 'Max Tokens'
            }
          },
          required: ['prompt']
        }
      }
    },
    
    // Remote tools
    {
      id: 'remote-1',
      name: 'Code Analyzer',
      description: 'Analyze code for bugs and improvements',
      icon: 'i-heroicons-code-bracket-20-solid',
      isRemote: true,
      serverId: '1',
      serverName: 'Default MCP Server',
      compatibleModels: ['gpt-4', 'claude-3-opus', 'claude-3-sonnet'],
      dependencies: ['eslint', 'prettier', 'typescript'],
      authType: 'API Key',
      providerName: 'OpenAI',
      authConfigured: true,
      endpoint: 'api/analyze-code',
      schema: {
        name: 'analyzeCode',
        description: 'Analyze code for bugs and suggest improvements',
        parameters: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'The code to analyze',
              title: 'Source Code'
            },
            language: {
              type: 'string',
              description: 'The programming language',
              enum: ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c++', 'c#'],
              default: 'javascript',
              title: 'Language'
            },
            checkStyle: {
              type: 'boolean',
              description: 'Check for style issues',
              default: true,
              title: 'Check Style'
            },
            checkSecurity: {
              type: 'boolean',
              description: 'Check for security vulnerabilities',
              default: true,
              title: 'Check Security'
            }
          },
          required: ['code', 'language']
        }
      }
    },
    {
      id: 'remote-2',
      name: 'Data Visualizer',
      description: 'Create visualizations from your data',
      icon: 'i-heroicons-chart-bar-20-solid',
      isRemote: true,
      serverId: '1',
      serverName: 'Default MCP Server',
      compatibleModels: [],
      dependencies: ['chart.js', 'd3.js'],
      authType: 'API Key',
      providerName: 'AutoByteus',
      authConfigured: true,
      endpoint: 'api/visualize-data',
      schema: {
        name: 'visualizeData',
        description: 'Create data visualizations',
        parameters: {
          type: 'object',
          properties: {
            data: {
              type: 'string',
              description: 'Data in JSON or CSV format',
              title: 'Input Data'
            },
            chartType: {
              type: 'string',
              description: 'Type of chart to create',
              enum: ['bar', 'line', 'pie', 'scatter', 'radar'],
              default: 'bar',
              title: 'Chart Type'
            },
            title: {
              type: 'string',
              description: 'Title for the chart',
              title: 'Chart Title'
            },
            width: {
              type: 'integer',
              description: 'Width of the chart in pixels',
              default: 800,
              title: 'Width'
            },
            height: {
              type: 'integer',
              description: 'Height of the chart in pixels',
              default: 500,
              title: 'Height'
            }
          },
          required: ['data', 'chartType']
        }
      }
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
