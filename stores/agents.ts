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
  tools: string[]; // Now stores GitHub URLs
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
  tools?: string[]; // Now stores GitHub URLs
  skills?: string[];
  // Indicates if this local agent has been published to the marketplace
  isPublishedToMarketplace?: boolean; 
}

// Data for creating a new local agent
export interface NewLocalAgentData {
  name: string;
  description: string;
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
      tools: ['https://github.com/example-org/vscode-utils-tool', 'https://github.com/example-org/git-cli-tool', 'https://github.com/example-org/npm-bridge-tool', 'https://github.com/example-org/python-runtime-tool', 'https://github.com/example-org/js-runtime-tool'],
      skills: ['JavaScript', 'Python', 'Code Reviews', 'Debugging', 'Documentation', 'Best Practices'],
      isPublishedToMarketplace: false,
    },
    {
      id: 'data-analyzer',
      name: 'Data Analyzer',
      description: 'Analyzes data and provides insights',
      icon: 'i-heroicons-chart-bar-20-solid',
      isRemote: false,
      role: 'Data Analyst',
      systemPrompt: 'You are a data analysis assistant that helps users understand their data, generate insights, and create visualizations. Provide statistical analysis and help with data processing tasks.',
      tools: ['https://github.com/example-org/pandas-wrapper-tool', 'https://github.com/example-org/numpy-bindings-tool', 'https://github.com/example-org/matplotlib-support-tool', 'https://github.com/example-org/jupyter-kernel-tool', 'https://github.com/example-org/r-integration-tool'],
      skills: ['Data Visualization', 'Statistical Analysis', 'Data Cleaning', 'Reporting', 'Predictive Modeling', 'Trend Analysis'],
      isPublishedToMarketplace: false,
    },
    {
      id: 'text-summarizer',
      name: 'Text Summarizer',
      description: 'Summarize long texts efficiently',
      icon: 'i-heroicons-document-text-20-solid',
      isRemote: false,
      role: 'Content Processor',
      systemPrompt: 'You are a text summarization assistant that helps users condense long documents while preserving key information. Generate concise summaries that capture the essential points.',
      tools: ['https://github.com/example-org/nlp-engine-core', 'https://github.com/example-org/text-processing-lib', 'https://github.com/example-org/language-model-interface'],
      skills: ['Text Summarization', 'Key Point Extraction', 'Multiple Format Support', 'Language Processing', 'Content Analysis'],
      isPublishedToMarketplace: false,
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
      tools: ['https://github.com/example-org/sphinx-generator-tool', 'https://github.com/example-org/jsdoc-parser-tool', 'https://github.com/example-org/readthedocs-publisher-tool', 'https://github.com/example-org/api-blueprint-tool'],
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
      tools: ['https://github.com/example-org/jest-runner-tool', 'https://github.com/example-org/pytest-adapter-tool', 'https://github.com/example-org/junit-interface-tool', 'https://github.com/example-org/mocha-scaffold-tool', 'https://github.com/example-org/selenium-grid-tool'],
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
      tools: ['https://github.com/tensorflow/tensorflow', 'https://github.com/pytorch/pytorch', 'https://github.com/NVIDIA/cuda-samples', 'https://github.com/scikit-learn/scikit-learn', 'https://github.com/optuna/optuna'],
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
      tools: ['https://github.com/FFmpeg/FFmpeg', 'https://github.com/opencv/opencv', 'https://github.com/example-org/gpu-processing-framework', 'https://github.com/example-org/media-encoder-suite', 'https://github.com/example-org/video-compressor-lib'],
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
      tools: ['https://github.com/openai/gpt-3', 'https://github.com/example-org/content-optimizer-tool', 'https://github.com/example-org/seo-tools-suite', 'https://github.com/example-org/grammar-checker-api', 'https://github.com/example-org/plagiarism-detector-service'],
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
      tools: ['https://github.com/example-org/local-nlp-engine', 'https://github.com/example-org/text-processor-core', 'https://github.com/example-org/lightweight-lm', 'https://github.com/example-org/keyword-extractor-lib', 'https://github.com/example-org/sentiment-analyzer-local'],
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
      tools: ['https://github.com/prettier/prettier', 'https://github.com/eslint/eslint', 'https://github.com/psf/black', 'https://github.com/golang/tools/tree/master/cmd/gofmt', 'https://github.com/llvm/llvm-project/tree/main/clang/tools/clang-format'],
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
      tools: ['https://github.com/example-org/file-analyzer-core', 'https://github.com/example-org/metadata-extractor-lib', 'https://github.com/example-org/content-classifier-ai', 'https://github.com/example-org/tag-manager-tool', 'https://github.com/example-org/duplicate-finder-app'],
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
      tools: ['https://github.com/example-org/sql-analyzer-engine', 'https://github.com/example-org/query-optimizer-ai', 'https://github.com/example-org/index-manager-pro', 'https://github.com/example-org/execution-planner-vis', 'https://github.com/example-org/schema-designer-tool'],
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
      tools: ['https://github.com/ImageMagick/ImageMagick', 'https://github.com/example-org/basic-image-filters', 'https://github.com/example-org/color-adjuster-lib', 'https://github.com/example-org/format-converter-cli', 'https://github.com/example-org/batch-image-processor'],
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
      tools: ['https://github.com/example-org/smart-scheduler-core', 'https://github.com/example-org/notification-system-lib', 'https://github.com/example-org/calendar-integration-api', 'https://github.com/example-org/priority-analyzer-ai', 'https://github.com/example-org/deadline-tracker-tool'],
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
      tools: ['https://github.com/tesseract-ocr/tesseract', 'https://github.com/example-org/image-preprocessor-ocr', 'https://github.com/example-org/text-detector-ml', 'https://github.com/example-org/layout-analyzer-tool', 'https://github.com/example-org/ocr-format-converter'],
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
      tools: ['https://github.com/d3/d3', 'https://github.com/chartjs/Chart.js', 'https://github.com/matplotlib/matplotlib', 'https://github.com/example-org/tableau-connector-lib', 'https://github.com/example-org/power-bi-integration-sdk'],
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
      tools: ['https://github.com/example-org/static-analyzer-sec', 'https://github.com/example-org/vulnerability-scanner-api', 'https://github.com/example-org/dependency-checker-tool', 'https://github.com/OWASP/ २०RuleSet', 'https://github.com/example-org/security-best-practices-db'],
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

  const createLocalAgent = (agentData: NewLocalAgentData) => {
    console.log('Creating local agent with data:', agentData);
    const newAgent: LocalAgent = {
      id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // More unique ID
      name: agentData.name,
      description: agentData.description,
      role: agentData.role || 'General Purpose Agent',
      systemPrompt: agentData.systemPrompt || 'You are a helpful AI assistant.',
      tools: agentData.tools || [],
      skills: agentData.skills || [],
      isRemote: false,
      icon: 'i-heroicons-user-circle-20-solid', // Default icon for new local agents
      isPublishedToMarketplace: false,
    };
    localAgents.value.push(newAgent);
    console.log('New local agent created:', newAgent);
    return newAgent;
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

  const publishLocalAgentToMarketplace = (agentId: string): MarketplaceAgent | null => {
    const localAgentIndex = localAgents.value.findIndex(agent => agent.id === agentId);
    if (localAgentIndex === -1) {
      console.error(`Local agent with ID ${agentId} not found for publishing.`);
      return null;
    }
    const agentToPublish = localAgents.value[localAgentIndex];

    const existingMarketplaceAgentIndex = marketplaceAgents.value.findIndex(ma => ma.id === agentToPublish.id);
    
    let publishedMarketplaceAgent: MarketplaceAgent;

    if (existingMarketplaceAgentIndex !== -1) {
      console.log(`Agent ${agentId} already exists in marketplace. Updating it.`);
      const existingAgent = marketplaceAgents.value[existingMarketplaceAgentIndex];
      publishedMarketplaceAgent = {
        ...existingAgent,
        name: agentToPublish.name,
        description: agentToPublish.description,
        role: agentToPublish.role || 'User Submitted Agent',
        systemPrompt: agentToPublish.systemPrompt,
        tools: agentToPublish.tools || [],
        skills: agentToPublish.skills || [],
        updatedAt: new Date().toISOString(),
        author: existingAgent.author === 'Local User' ? 'Local User (Updated)' : existingAgent.author, // Keep original author if not 'Local User'
        version: existingAgent.version || '1.0.1', // Simple version update logic
      };
      marketplaceAgents.value[existingMarketplaceAgentIndex] = publishedMarketplaceAgent;
    } else {
      publishedMarketplaceAgent = {
        id: agentToPublish.id, 
        name: agentToPublish.name,
        description: agentToPublish.description,
        category: 'User Submitted', 
        price: 0, 
        priceType: 'free',
        executionType: 'LOCAL', 
        rating: 0, 
        downloads: 0, 
        version: '1.0.0', 
        author: 'Local User', 
        tools: agentToPublish.tools || [],
        skills: agentToPublish.skills || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        role: agentToPublish.role || 'User Submitted Agent',
        systemPrompt: agentToPublish.systemPrompt,
      };
      marketplaceAgents.value.push(publishedMarketplaceAgent);
    }
    
    localAgents.value[localAgentIndex].isPublishedToMarketplace = true;
    localAgents.value[localAgentIndex] = {...localAgents.value[localAgentIndex]}; // Trigger reactivity for the local agent item itself
    
    console.log('Local agent published/updated in marketplace:', publishedMarketplaceAgent);
    return publishedMarketplaceAgent;
  };

  const installMarketplaceAgent = (agent: MarketplaceAgent) => {
    const localAgent: LocalAgent = {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      isRemote: false, 
      role: agent.role,
      systemPrompt: agent.systemPrompt,
      tools: agent.tools, 
      skills: agent.skills,
      isPublishedToMarketplace: true 
    };
    if (!localAgents.value.some(la => la.id === localAgent.id)) {
        addAgent(localAgent);
    } else {
      // If it exists, perhaps update it with marketplace data?
      // For now, just ensures it's marked as from marketplace if installed.
      const existingIndex = localAgents.value.findIndex(la => la.id === localAgent.id);
      if (existingIndex !== -1) {
        localAgents.value[existingIndex] = {
          ...localAgents.value[existingIndex], // Keep existing local data not overridden
          ...localAgent, // Override with marketplace data
          isPublishedToMarketplace: true, // Ensure this is set
        };
      }
    }
  };

  return {
    // Local agents
    localAgents,
    getLocalAgents,
    getRemoteAgents,
    getAgentsByServerId,
    getAgentById,
    addAgent,
    createLocalAgent, 
    updateAgent,
    deleteAgent,
    deleteAgentsByServerId,
    
    // Marketplace agents
    marketplaceAgents,
    syncMarketplace,
    publishLocalAgentToMarketplace, // Ensure this is returned
    installMarketplaceAgent
  };
});
