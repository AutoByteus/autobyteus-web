import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface ChatMessage {
  id: string;
  agentId: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: number;
}

interface AgentConversation {
  [agentId: string]: ChatMessage[];
}

export const useChatStore = defineStore('chat', () => {
  // State
  const conversations = ref<AgentConversation>({});
  const exampleConversations = ref<AgentConversation>({
    // Code Assistant example conversation
    'code-assistant': [
      {
        id: '1',
        agentId: 'code-assistant',
        sender: 'agent',
        text: "Hello! I'm Code Assistant. I'm a Coding Assistant. How can I assist you today?",
        timestamp: Date.now() - 120000
      },
      {
        id: '2',
        agentId: 'code-assistant',
        sender: 'user',
        text: 'Can you help me analyze this data?',
        timestamp: Date.now() - 60000
      },
      {
        id: '3',
        agentId: 'code-assistant',
        sender: 'agent',
        text: "I've analyzed your code and found some optimization opportunities. Would you like me to explain the suggested improvements?",
        timestamp: Date.now() - 30000
      }
    ],
    
    // Data Analyzer example conversation
    'data-analyzer': [
      {
        id: '1',
        agentId: 'data-analyzer',
        sender: 'agent',
        text: "Hello! I'm Data Analyzer. I'm a Data Analyst. How can I assist you today?",
        timestamp: Date.now() - 120000
      },
      {
        id: '2',
        agentId: 'data-analyzer',
        sender: 'user',
        text: 'Can you help me analyze this dataset?',
        timestamp: Date.now() - 60000
      },
      {
        id: '3',
        agentId: 'data-analyzer',
        sender: 'agent',
        text: "I've examined the data and identified some interesting patterns. The key insights are: higher conversion rates on weekends, increased engagement with video content, and a strong correlation between price and quality perception.",
        timestamp: Date.now() - 30000
      }
    ],
    
    // Text Summarizer example conversation
    'text-summarizer': [
      {
        id: '1',
        agentId: 'text-summarizer',
        sender: 'agent',
        text: "Hello! I'm Text Summarizer. I'm a Content Processor. How can I assist you today?",
        timestamp: Date.now() - 120000
      },
      {
        id: '2',
        agentId: 'text-summarizer',
        sender: 'user',
        text: 'Can you summarize this article for me?',
        timestamp: Date.now() - 60000
      },
      {
        id: '3',
        agentId: 'text-summarizer',
        sender: 'agent',
        text: "I've created a concise summary of the text while preserving all key information. The main points are clearly highlighted and organized for easy understanding.",
        timestamp: Date.now() - 30000
      }
    ],
    
    // Documentation Generator example conversation
    'remote-1': [
      {
        id: '1',
        agentId: 'remote-1',
        sender: 'agent',
        text: "Hello! I'm Documentation Generator. I'm a Documentation Specialist. How can I assist you today?",
        timestamp: Date.now() - 120000
      },
      {
        id: '2',
        agentId: 'remote-1',
        sender: 'user',
        text: 'Can you generate documentation for my project?',
        timestamp: Date.now() - 60000
      },
      {
        id: '3',
        agentId: 'remote-1',
        sender: 'agent',
        text: "I'll generate comprehensive documentation for your project. The documentation will include class descriptions, function references, API endpoints, and usage examples.",
        timestamp: Date.now() - 30000
      }
    ],
    
    // Test Case Generator example conversation
    'remote-2': [
      {
        id: '1',
        agentId: 'remote-2',
        sender: 'agent',
        text: "Hello! I'm Test Case Generator. I'm a QA Engineer. How can I assist you today?",
        timestamp: Date.now() - 120000
      },
      {
        id: '2',
        agentId: 'remote-2',
        sender: 'user',
        text: 'Can you create test cases for my application?',
        timestamp: Date.now() - 60000
      },
      {
        id: '3',
        agentId: 'remote-2',
        sender: 'agent',
        text: "I'll create a comprehensive set of test cases for your application. This will include unit tests, integration tests, and edge case scenarios to ensure thorough coverage.",
        timestamp: Date.now() - 30000
      }
    ]
  });

  // Getters
  const getConversation = (agentId: string) => {
    // If a conversation exists, return it
    if (conversations.value[agentId]) {
      return conversations.value[agentId];
    }
    
    // If an example conversation exists, clone it
    if (exampleConversations.value[agentId]) {
      conversations.value[agentId] = [...exampleConversations.value[agentId]];
      return conversations.value[agentId];
    }
    
    // Otherwise, return an empty array
    conversations.value[agentId] = [];
    return conversations.value[agentId];
  };

  // Actions
  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const id = Date.now().toString();
    const timestamp = Date.now();
    
    // Ensure the agent's conversation array exists
    if (!conversations.value[message.agentId]) {
      conversations.value[message.agentId] = [];
    }
    
    // Add the message
    conversations.value[message.agentId].push({
      ...message,
      id,
      timestamp
    });
  };

  const clearConversation = (agentId: string) => {
    conversations.value[agentId] = [];
  };

  return {
    conversations,
    getConversation,
    addMessage,
    clearConversation
  };
});
