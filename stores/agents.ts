import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useServersStore } from './servers';

// Marketplace Agent Interface - same as niuzhirui-web
export interface MarketplaceAgent {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  priceType: 'free' | 'one-time' | 'monthly' | 'yearly' | 'usage-based';
  executionType: 'LOCAL' | 'P2P' | 'BOTH';
  rating: number;
  downloads: number;
  version: string;
  author: string;
  tools: string[];
  createdAt: string;
  updatedAt: string;
  status?: 'active' | 'inactive'; // Only for P2P agents
  role: string;
  systemPrompt?: string;
  skills: string[];
  
  // P2P specific fields
  p2pInfo?: {
    connectionRequirements: string[];
    performanceMetrics: {
      avgResponseTime: string;
      reliability: string;
      uptime: string;
    };
    securityLevel: string;
    accessControl: string[];
  };
}

// Enhanced Local Agent Interface with more properties
export interface LocalAgent {
  id: string;
  name: string;
  description: string;
  icon?: string;
  isRemote: boolean;
  serverId?: string;
  serverName?: string;
  role?: string;
  systemPrompt?: string;
  tools?: string[];
  skills?: string[];
}

export const useAgentsStore = defineStore('agents', () => {
  // State for local agents (enhanced model with more properties)
  const localAgents = ref<LocalAgent[]>([
    {
      id: 'code-assistant',
      name: 'Code Assistant',
      description: 'Helps with coding tasks and problem-solving',
      icon: 'i-heroicons-code-bracket-20-solid',
      isRemote: false,
      role: 'Coding Assistant',
      systemPrompt: 'You are a helpful coding assistant specializing in helping users write clean, efficient, and bug-free code. Provide code snippets, explain programming concepts, and help debug issues.',
      tools: ['VSCode', 'Git', 'npm', 'Python', 'JavaScript Runtime'],
      skills: ['JavaScript', 'Python', 'Code Reviews', 'Debugging', 'Documentation', 'Best Practices']
    },
    {
      id: 'data-analyzer',
      name: 'Data Analyzer',
      description: 'Analyzes data and provides insights',
      icon: 'i-heroicons-chart-bar-20-solid',
      isRemote: false,
      role: 'Data Analyst',
      systemPrompt: 'You are a data analysis assistant that helps users understand their data, generate insights, and create visualizations. Provide statistical analysis and help with data processing tasks.',
      tools: ['Pandas', 'NumPy', 'Matplotlib', 'Jupyter', 'R Studio'],
      skills: ['Data Visualization', 'Statistical Analysis', 'Data Cleaning', 'Reporting', 'Predictive Modeling', 'Trend Analysis']
    },
    {
      id: 'text-summarizer',
      name: 'Text Summarizer',
      description: 'Summarize long texts efficiently',
      icon: 'i-heroicons-document-text-20-solid',
      isRemote: false,
      role: 'Content Processor',
      systemPrompt: 'You are a text summarization assistant that helps users condense long documents while preserving key information. Generate concise summaries that capture the essential points.',
      tools: ['NLP Engine', 'Text Processor', 'Language Models'],
      skills: ['Text Summarization', 'Key Point Extraction', 'Multiple Format Support', 'Language Processing', 'Content Analysis']
    },
    
    // Remote agents (example)
    {
      id: 'remote-1',
      name: 'Documentation Generator',
      description: 'Automatically generates documentation from code',
      icon: 'i-heroicons-document-text-20-solid',
      isRemote: true,
      serverId: '2',
      serverName: 'Default Agent Server',
      role: 'Documentation Specialist',
      systemPrompt: 'You generate comprehensive documentation from code. Document classes, functions, APIs, and usage examples clearly and thoroughly.',
      tools: ['Sphinx', 'JSDoc', 'ReadTheDocs', 'API Blueprint'],
      skills: ['API Documentation', 'Code Documentation', 'Markdown Generation', 'Usage Examples', 'Technical Writing']
    },
    {
      id: 'remote-2',
      name: 'Test Case Generator',
      description: 'Creates test cases for your application',
      icon: 'i-heroicons-beaker-20-solid',
      isRemote: true,
      serverId: '2',
      serverName: 'Default Agent Server',
      role: 'QA Engineer',
      systemPrompt: 'You are a test case generator that helps users create thorough test suites for their applications. Generate unit tests, integration tests, and edge cases to ensure code quality.',
      tools: ['Jest', 'PyTest', 'JUnit', 'Mocha', 'Selenium'],
      skills: ['Unit Testing', 'Integration Testing', 'Test Coverage Analysis', 'Edge Case Detection', 'Regression Testing']
    }
  ]);

  // State for visible marketplace agents
  const marketplaceAgents = ref<MarketplaceAgent[]>([
    // P2P agents
    {
      id: 'marketplace-1',
      name: 'ML Model Trainer',
      description: 'Train machine learning models with GPU acceleration',
      category: 'AI & ML',
      price: 29.99,
      priceType: 'monthly',
      executionType: 'P2P',
      rating: 4.8,
      downloads: 15000,
      version: '3.2.0',
      author: 'AI Solutions Inc.',
      tools: ['tensorflow', 'pytorch', 'cuda', 'sklearn', 'optuna'],
      createdAt: '2024-01-01',
      updatedAt: '2024-03-10',
      status: 'active',
      role: 'ML Engineer',
      systemPrompt: 'You help train and optimize machine learning models efficiently. Provide recommendations for model architectures, hyperparameters, and training strategies to achieve optimal performance.',
      skills: ['Model training', 'GPU optimization', 'Performance tuning', 'Data preprocessing', 'Hyperparameter optimization', 'Feature engineering'],
      p2pInfo: {
        connectionRequirements: ['GPU acceleration', 'High-bandwidth internet', 'API authentication'],
        performanceMetrics: {
          avgResponseTime: '2.3s',
          reliability: '99.7%',
          uptime: '99.9% SLA'
        },
        securityLevel: 'Enterprise Grade',
        accessControl: ['API Key Authentication', 'Rate Limiting', 'Encrypted data transfer']
      }
    },
    {
      id: 'marketplace-2',
      name: 'Video Processor',
      description: 'Process videos with high-performance computing',
      category: 'Media',
      price: 0.05,
      priceType: 'usage-based',
      executionType: 'P2P',
      rating: 4.7,
      downloads: 8200,
      version: '1.8.0',
      author: 'MediaTech Ltd.',
      tools: ['ffmpeg', 'opencv', 'gpu-processing', 'media-encoder', 'video-compressor'],
      createdAt: '2024-01-15',
      updatedAt: '2024-03-15',
      status: 'active',
      role: 'Video Editor',
      systemPrompt: 'You process videos with high quality while maintaining efficiency. Help users with video encoding, frame processing, format conversion, and enhancement filters.',
      skills: ['Video encoding', 'Frame processing', 'Format conversion', 'Enhancement filters', 'Color correction', 'Noise reduction'],
      p2pInfo: {
        connectionRequirements: ['High-bandwidth network', 'GPU required', 'Storage access'],
        performanceMetrics: {
          avgResponseTime: '5.1s',
          reliability: '99.4%',
          uptime: '99.7% SLA'
        },
        securityLevel: 'Standard',
        accessControl: ['API authentication', 'Usage quotas', 'Content encryption']
      }
    },
    {
      id: 'marketplace-5',
      name: 'AI Content Generator',
      description: 'Create high-quality content with AI assistance',
      category: 'Content Creation',
      price: 49.99,
      priceType: 'monthly',
      executionType: 'P2P',
      rating: 4.9,
      downloads: 22000,
      version: '2.5.0',
      author: 'ContentPro AI',
      tools: ['gpt-4', 'content-optimizer', 'seo-tools', 'grammar-checker', 'plagiarism-detector'],
      createdAt: '2024-01-10',
      updatedAt: '2024-03-25',
      status: 'active',
      role: 'Content Strategist',
      systemPrompt: 'You create compelling content tailored to specific audiences. Generate blog posts, social media content, and marketing copy that engages readers and aligns with brand voice.',
      skills: ['Content writing', 'SEO optimization', 'Brand voice adaptation', 'Multi-format content', 'Audience targeting', 'Headline crafting'],
      p2pInfo: {
        connectionRequirements: ['API key', 'HTTPS connection'],
        performanceMetrics: {
          avgResponseTime: '3.2s',
          reliability: '99.6%',
          uptime: '99.8% SLA'
        },
        securityLevel: 'High Security',
        accessControl: ['OAuth 2.0', 'Content encryption', 'Usage monitoring']
      }
    },
    // Locally runnable agents
    {
      id: 'marketplace-3',
      name: 'Text Summarizer',
      description: 'Summarize long texts efficiently',
      category: 'Productivity',
      price: 0,
      priceType: 'free',
      executionType: 'LOCAL',
      rating: 4.6,
      downloads: 12500,
      version: '1.2.0',
      author: 'TextTools Co.',
      tools: ['nlp-engine', 'text-processor', 'language-models', 'keyword-extractor', 'sentiment-analyzer'],
      createdAt: '2024-02-01',
      updatedAt: '2024-03-20',
      role: 'Content Processor',
      systemPrompt: 'You create concise summaries while preserving key information. Help users extract the most important points from long documents, articles, and research papers.',
      skills: ['Text summarization', 'Key point extraction', 'Multiple format support', 'Language processing', 'Document analysis', 'Information synthesis']
    },
    {
      id: 'marketplace-4',
      name: 'Code Formatter',
      description: 'Format code in multiple programming languages',
      category: 'Development',
      price: 4.99,
      priceType: 'one-time',
      executionType: 'LOCAL',
      rating: 4.9,
      downloads: 18500,
      version: '2.1.0',
      author: 'CodeBetter',
      tools: ['prettier', 'eslint', 'black', 'gofmt', 'clang-format'],
      createdAt: '2024-01-15',
      updatedAt: '2024-03-10',
      role: 'Code Formatter',
      systemPrompt: 'You format code according to best practices and style guidelines. Apply consistent formatting to improve readability and maintainability across different programming languages.',
      skills: ['Code formatting', 'Syntax checking', 'Style enforcement', 'Multi-language support', 'Code style configuration', 'Auto-indentation']
    },
    {
      id: 'marketplace-7',
      name: 'File Organizer Pro',
      description: 'Organize files and folders with AI-powered categorization',
      category: 'Productivity',
      price: 7.99,
      priceType: 'one-time',
      executionType: 'LOCAL',
      rating: 4.7,
      downloads: 15200,
      version: '2.0.0',
      author: 'OrganizeIt Ltd.',
      tools: ['file-analyzer', 'metadata-extractor', 'content-classifier', 'tag-manager', 'duplicate-finder'],
      createdAt: '2024-01-25',
      updatedAt: '2024-03-22',
      role: 'File Manager',
      systemPrompt: 'You organize files efficiently based on content and metadata. Help users categorize, tag, and structure their files for easy retrieval and improved workflow.',
      skills: ['File categorization', 'Duplicate detection', 'Smart tagging', 'Bulk operations', 'Metadata organization', 'Naming conventions']
    }
  ]);

  // State for hidden marketplace agents (revealed after sync)
  const hiddenMarketplaceAgents = ref<MarketplaceAgent[]>([
    // Additional agents that will appear after syncing
    {
      id: 'marketplace-6',
      name: 'Database Optimizer',
      description: 'Optimize database performance with AI-powered analysis',
      category: 'Database',
      price: 99.99,
      priceType: 'monthly',
      executionType: 'P2P',
      rating: 4.6,
      downloads: 5500,
      version: '1.5.0',
      author: 'DBOptimize Inc.',
      tools: ['sql-analyzer', 'query-optimizer', 'index-manager', 'execution-planner', 'schema-designer'],
      createdAt: '2024-02-01',
      updatedAt: '2024-03-20',
      status: 'active',
      role: 'Database Administrator',
      systemPrompt: 'You analyze and optimize database performance. Identify slow queries, suggest index improvements, and provide recommendations for schema optimization.',
      skills: ['Query optimization', 'Index analysis', 'Performance tuning', 'Schema recommendations', 'Bottleneck detection', 'Caching strategies'],
      p2pInfo: {
        connectionRequirements: ['Database access', 'Secure connection'],
        performanceMetrics: {
          avgResponseTime: '4.5s',
          reliability: '99.8%',
          uptime: '99.9% SLA'
        },
        securityLevel: 'Enterprise Grade',
        accessControl: ['Database credentials', 'Audit logging', 'Access restrictions']
      }
    },
    {
      id: 'marketplace-8',
      name: 'Image Processor Lite',
      description: 'Basic image processing and enhancement for local use',
      category: 'Media',
      price: 0,
      priceType: 'free',
      executionType: 'LOCAL',
      rating: 4.5,
      downloads: 9800,
      version: '1.0.5',
      author: 'ImageLite',
      tools: ['image-magick', 'basic-filters', 'color-adjuster', 'format-converter', 'batch-processor'],
      createdAt: '2024-02-10',
      updatedAt: '2024-03-18',
      role: 'Image Editor',
      systemPrompt: 'You perform basic image processing tasks efficiently. Help users resize, convert, and enhance images while maintaining quality and optimizing file size.',
      skills: ['Image resizing', 'Basic filters', 'Format conversion', 'Batch processing', 'Color adjustment', 'Compression']
    },
    {
      id: 'marketplace-9',
      name: 'Task Scheduler',
      description: 'Intelligent task scheduling and reminder system',
      category: 'Productivity',
      price: 0,
      priceType: 'free',
      executionType: 'LOCAL',
      rating: 4.4,
      downloads: 7600,
      version: '1.3.0',
      author: 'TaskMaster',
      tools: ['scheduler', 'notification-system', 'calendar-integration', 'priority-analyzer', 'deadline-tracker'],
      createdAt: '2024-02-15',
      updatedAt: '2024-03-19',
      role: 'Task Manager',
      systemPrompt: 'You help organize and prioritize tasks effectively. Assist users in managing their workload, setting deadlines, and creating efficient schedules based on priorities and dependencies.',
      skills: ['Task prioritization', 'Smart reminders', 'Recurring tasks', 'Time management', 'Deadline tracking', 'Dependency mapping']
    },
    {
      id: 'marketplace-10',
      name: 'Document Scanner OCR',
      description: 'Extract text from scanned documents with OCR technology',
      category: 'Productivity',
      price: 9.99,
      priceType: 'one-time',
      executionType: 'LOCAL',
      rating: 4.8,
      downloads: 11200,
      version: '1.4.2',
      author: 'ScanPro Inc.',
      tools: ['tesseract', 'image-preprocessor', 'text-detector', 'layout-analyzer', 'format-converter'],
      createdAt: '2024-01-20',
      updatedAt: '2024-03-23',
      role: 'Document Processor',
      systemPrompt: 'You extract text from images and scanned documents accurately. Convert printed and handwritten text into editable digital formats while preserving document structure and formatting.',
      skills: ['OCR processing', 'Text extraction', 'Multiple language support', 'Format preservation', 'Handwriting recognition', 'Document structure analysis']
    },
    {
      id: 'marketplace-11',
      name: 'Data Visualization Expert',
      description: 'Create beautiful data visualizations and interactive dashboards',
      category: 'Analytics',
      price: 14.99,
      priceType: 'monthly',
      executionType: 'LOCAL',
      rating: 4.7,
      downloads: 8900,
      version: '2.2.0',
      author: 'VisualizeData',
      tools: ['d3.js', 'chart.js', 'matplotlib', 'tableau-connector', 'power-bi-integration'],
      createdAt: '2024-02-05',
      updatedAt: '2024-04-10',
      role: 'Data Visualization Expert',
      systemPrompt: 'You transform raw data into compelling visualizations. Help users create charts, graphs, and dashboards that effectively communicate insights and tell data stories.',
      skills: ['Interactive charts', 'Dashboard creation', 'Color theory', 'Data storytelling', 'Responsive design', 'Custom visualizations']
    },
    {
      id: 'marketplace-12',
      name: 'Security Audit Assistant',
      description: 'Analyze code and systems for security vulnerabilities',
      category: 'Security',
      price: 39.99,
      priceType: 'monthly',
      executionType: 'P2P',
      rating: 4.9,
      downloads: 6300,
      version: '3.0.1',
      author: 'SecureCode Systems',
      tools: ['static-analyzer', 'vulnerability-scanner', 'dependency-checker', 'owasp-rules', 'security-best-practices'],
      createdAt: '2024-03-01',
      updatedAt: '2024-04-15',
      status: 'active',
      role: 'Security Auditor',
      systemPrompt: 'You identify security vulnerabilities in code and systems. Provide comprehensive reports with remediation recommendations following industry best practices.',
      skills: ['Vulnerability detection', 'Security best practices', 'Compliance checking', 'Risk assessment', 'Remediation guidance', 'Security reporting'],
      p2pInfo: {
        connectionRequirements: ['Secure code access', 'Authentication required'],
        performanceMetrics: {
          avgResponseTime: '7.2s',
          reliability: '99.9%',
          uptime: '99.95% SLA'
        },
        securityLevel: 'Enterprise Grade',
        accessControl: ['Multi-factor auth', 'Encrypted channel', 'Access logging']
      }
    }
  ]);

  // Getters for local agents
  const getLocalAgents = computed(() => 
    localAgents.value.filter(agent => !agent.isRemote)
  );
  
  const getRemoteAgents = computed(() => 
    localAgents.value.filter(agent => agent.isRemote)
  );
  
  const getAgentsByServerId = (serverId: string) => 
    localAgents.value.filter(agent => agent.serverId === serverId);

  const getAgentById = (agentId: string): LocalAgent | MarketplaceAgent | undefined => 
    localAgents.value.find(agent => agent.id === agentId) || 
    marketplaceAgents.value.find(agent => agent.id === agentId);

  // Actions for local agents
  const addAgent = (agent: LocalAgent) => {
    localAgents.value.push(agent);
  };

  const updateAgent = (updatedAgent: LocalAgent) => {
    const index = localAgents.value.findIndex(a => a.id === updatedAgent.id);
    if (index !== -1) {
      localAgents.value[index] = updatedAgent;
    }
  };

  const deleteAgent = (agentId: string) => {
    localAgents.value = localAgents.value.filter(a => a.id !== agentId);
  };

  // Handle server deletion
  const serversStore = useServersStore();
  const deleteAgentsByServerId = (serverId: string) => {
    localAgents.value = localAgents.value.filter(a => a.serverId !== serverId);
  };

  // Marketplace actions
  const syncMarketplace = () => {
    // Simulate fetching data from marketplace API by moving hidden agents to visible
    console.log('Syncing marketplace...');
    
    // Add hidden agents to marketplace agents
    hiddenMarketplaceAgents.value.forEach(agent => {
      if (!marketplaceAgents.value.some(a => a.id === agent.id)) {
        marketplaceAgents.value.push({...agent});
      }
    });
    
    // Clear hidden agents
    hiddenMarketplaceAgents.value = [];
  };

  const publishAgent = (agent: LocalAgent) => {
    // Simulate publishing agent to marketplace
    console.log('Publishing agent to marketplace:', agent.name);
  };

  const installMarketplaceAgent = (agent: MarketplaceAgent) => {
    // Convert marketplace agent to local agent with complete data
    const localAgent: LocalAgent = {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      isRemote: false,
      role: agent.role,
      systemPrompt: agent.systemPrompt,
      tools: agent.tools,
      skills: agent.skills
    };
    addAgent(localAgent);
  };

  return {
    // Local agents
    localAgents,
    getLocalAgents,
    getRemoteAgents,
    getAgentsByServerId,
    getAgentById,
    addAgent,
    updateAgent,
    deleteAgent,
    deleteAgentsByServerId,
    
    // Marketplace agents
    marketplaceAgents,
    syncMarketplace,
    publishAgent,
    installMarketplaceAgent
  };
});
