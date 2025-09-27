import gql from 'graphql-tag';
import * as VueApolloComposable from '@vue/apollo-composable';
import * as VueCompositionApi from '@vue/composition-api';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type ReactiveFunction<TParam> = () => TParam;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
  JSON: { input: any; output: any; }
};

export type AddNewPromptRevisionInput = {
  id: Scalars['String']['input'];
  newPromptContent: Scalars['String']['input'];
};

export type AgentConversation = {
  __typename?: 'AgentConversation';
  agentDefinitionId: Scalars['String']['output'];
  agentId: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  llmModel?: Maybe<Scalars['String']['output']>;
  messages: Array<Message>;
  useXmlToolFormat: Scalars['Boolean']['output'];
};

export type AgentDefinition = {
  __typename?: 'AgentDefinition';
  description: Scalars['String']['output'];
  id: Scalars['String']['output'];
  inputProcessorNames: Array<Scalars['String']['output']>;
  llmResponseProcessorNames: Array<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  phaseHookNames: Array<Scalars['String']['output']>;
  prompts: Array<Prompt>;
  role: Scalars['String']['output'];
  systemPromptCategory?: Maybe<Scalars['String']['output']>;
  systemPromptName?: Maybe<Scalars['String']['output']>;
  systemPromptProcessorNames: Array<Scalars['String']['output']>;
  toolExecutionResultProcessorNames: Array<Scalars['String']['output']>;
  toolNames: Array<Scalars['String']['output']>;
};

export type AgentInstance = {
  __typename?: 'AgentInstance';
  agentDefinitionId?: Maybe<Scalars['String']['output']>;
  currentPhase: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  role: Scalars['String']['output'];
  workspace?: Maybe<WorkspaceInfo>;
};

export enum AgentOperationalPhase {
  AnalyzingLlmResponse = 'ANALYZING_LLM_RESPONSE',
  AwaitingLlmResponse = 'AWAITING_LLM_RESPONSE',
  AwaitingToolApproval = 'AWAITING_TOOL_APPROVAL',
  Bootstrapping = 'BOOTSTRAPPING',
  Error = 'ERROR',
  ExecutingTool = 'EXECUTING_TOOL',
  Idle = 'IDLE',
  ProcessingToolResult = 'PROCESSING_TOOL_RESULT',
  ProcessingUserInput = 'PROCESSING_USER_INPUT',
  ShutdownComplete = 'SHUTDOWN_COMPLETE',
  ShuttingDown = 'SHUTTING_DOWN',
  ToolDenied = 'TOOL_DENIED',
  Uninitialized = 'UNINITIALIZED'
}

export type AgentTeamDefinition = {
  __typename?: 'AgentTeamDefinition';
  coordinatorMemberName: Scalars['String']['output'];
  description: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  nodes: Array<TeamMember>;
  role?: Maybe<Scalars['String']['output']>;
};

export enum AgentTeamEventSourceType {
  Agent = 'AGENT',
  SubTeam = 'SUB_TEAM',
  TaskBoard = 'TASK_BOARD',
  Team = 'TEAM'
}

export type AgentTeamInstance = {
  __typename?: 'AgentTeamInstance';
  currentPhase: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  role?: Maybe<Scalars['String']['output']>;
};

export enum AgentTeamOperationalPhase {
  Bootstrapping = 'BOOTSTRAPPING',
  Error = 'ERROR',
  Idle = 'IDLE',
  Processing = 'PROCESSING',
  ShutdownComplete = 'SHUTDOWN_COMPLETE',
  ShuttingDown = 'SHUTTING_DOWN',
  Uninitialized = 'UNINITIALIZED'
}

export type AgentUserInput = {
  content: Scalars['String']['input'];
  contextFiles?: InputMaybe<Array<ContextFilePathInput>>;
};

export type ApproveToolInvocationInput = {
  agentId: Scalars['String']['input'];
  invocationId: Scalars['String']['input'];
  isApproved: Scalars['Boolean']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type ApproveToolInvocationResult = {
  __typename?: 'ApproveToolInvocationResult';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type CommandExecutionResult = {
  __typename?: 'CommandExecutionResult';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type ConfigureMcpServerResult = {
  __typename?: 'ConfigureMcpServerResult';
  savedConfig: McpServerConfigUnion;
};

export type ContextFilePathInput = {
  path: Scalars['String']['input'];
  type: ContextFileType;
};

export enum ContextFileType {
  Audio = 'AUDIO',
  Csv = 'CSV',
  Docx = 'DOCX',
  Html = 'HTML',
  Image = 'IMAGE',
  Javascript = 'JAVASCRIPT',
  Json = 'JSON',
  Markdown = 'MARKDOWN',
  Pdf = 'PDF',
  Pptx = 'PPTX',
  Python = 'PYTHON',
  Text = 'TEXT',
  Unknown = 'UNKNOWN',
  Video = 'VIDEO',
  Xlsx = 'XLSX',
  Xml = 'XML'
}

export type ConversationHistory = {
  __typename?: 'ConversationHistory';
  conversations: Array<AgentConversation>;
  currentPage: Scalars['Int']['output'];
  totalConversations: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type CreateAgentDefinitionInput = {
  description: Scalars['String']['input'];
  inputProcessorNames?: InputMaybe<Array<Scalars['String']['input']>>;
  llmResponseProcessorNames?: InputMaybe<Array<Scalars['String']['input']>>;
  name: Scalars['String']['input'];
  phaseHookNames?: InputMaybe<Array<Scalars['String']['input']>>;
  role: Scalars['String']['input'];
  systemPromptCategory: Scalars['String']['input'];
  systemPromptName: Scalars['String']['input'];
  systemPromptProcessorNames?: InputMaybe<Array<Scalars['String']['input']>>;
  toolExecutionResultProcessorNames?: InputMaybe<Array<Scalars['String']['input']>>;
  toolNames?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type CreateAgentTeamDefinitionInput = {
  coordinatorMemberName: Scalars['String']['input'];
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  nodes: Array<TeamMemberInput>;
  role?: InputMaybe<Scalars['String']['input']>;
};

export type CreateAgentTeamInstanceInput = {
  memberConfigs: Array<TeamMemberConfigInput>;
  taskNotificationMode?: InputMaybe<TaskNotificationModeEnum>;
  teamDefinitionId: Scalars['String']['input'];
  useXmlToolFormat?: InputMaybe<Scalars['Boolean']['input']>;
};

export type CreateAgentTeamInstanceResult = {
  __typename?: 'CreateAgentTeamInstanceResult';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
  teamId?: Maybe<Scalars['String']['output']>;
};

export type CreatePromptInput = {
  category: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  isForAgentTeam?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  promptContent: Scalars['String']['input'];
  suitableForModels?: InputMaybe<Scalars['String']['input']>;
};

export type CreateWorkspaceInput = {
  config: Scalars['JSON']['input'];
  workspaceTypeName: Scalars['String']['input'];
};

export type DeleteAgentDefinitionResult = {
  __typename?: 'DeleteAgentDefinitionResult';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type DeleteAgentTeamDefinitionResult = {
  __typename?: 'DeleteAgentTeamDefinitionResult';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type DeleteMcpServerResult = {
  __typename?: 'DeleteMcpServerResult';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type DeletePromptInput = {
  id: Scalars['String']['input'];
};

export type DeletePromptResult = {
  __typename?: 'DeletePromptResult';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type DiscoverAndRegisterMcpServerToolsResult = {
  __typename?: 'DiscoverAndRegisterMcpServerToolsResult';
  discoveredTools: Array<ToolDefinitionDetail>;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type GraphQlAgentEventRebroadcastPayload = {
  __typename?: 'GraphQLAgentEventRebroadcastPayload';
  agentEvent: GraphQlStreamEvent;
  agentName: Scalars['String']['output'];
};

export type GraphQlAgentOperationalPhaseTransitionData = {
  __typename?: 'GraphQLAgentOperationalPhaseTransitionData';
  errorDetails?: Maybe<Scalars['String']['output']>;
  errorMessage?: Maybe<Scalars['String']['output']>;
  newPhase: AgentOperationalPhase;
  oldPhase?: Maybe<AgentOperationalPhase>;
  toolName?: Maybe<Scalars['String']['output']>;
  trigger?: Maybe<Scalars['String']['output']>;
};

export type GraphQlAgentTeamPhaseTransitionData = {
  __typename?: 'GraphQLAgentTeamPhaseTransitionData';
  errorMessage?: Maybe<Scalars['String']['output']>;
  newPhase: AgentTeamOperationalPhase;
  oldPhase?: Maybe<AgentTeamOperationalPhase>;
};

export type GraphQlAgentTeamStreamDataPayload = GraphQlAgentEventRebroadcastPayload | GraphQlAgentTeamPhaseTransitionData | GraphQlSubTeamEventRebroadcastPayload | GraphQlTaskStatusUpdatedEvent | GraphQlTasksAddedEvent;

export type GraphQlAgentTeamStreamEvent = {
  __typename?: 'GraphQLAgentTeamStreamEvent';
  data: GraphQlAgentTeamStreamDataPayload;
  eventId: Scalars['String']['output'];
  eventSourceType: AgentTeamEventSourceType;
  teamId: Scalars['String']['output'];
  timestamp: Scalars['DateTime']['output'];
};

export type GraphQlAssistantChunkData = {
  __typename?: 'GraphQLAssistantChunkData';
  audioUrls?: Maybe<Array<Scalars['String']['output']>>;
  content: Scalars['String']['output'];
  imageUrls?: Maybe<Array<Scalars['String']['output']>>;
  isComplete: Scalars['Boolean']['output'];
  reasoning?: Maybe<Scalars['String']['output']>;
  usage?: Maybe<GraphQlTokenUsage>;
  videoUrls?: Maybe<Array<Scalars['String']['output']>>;
};

export type GraphQlAssistantCompleteResponseData = {
  __typename?: 'GraphQLAssistantCompleteResponseData';
  audioUrls?: Maybe<Array<Scalars['String']['output']>>;
  content: Scalars['String']['output'];
  imageUrls?: Maybe<Array<Scalars['String']['output']>>;
  reasoning?: Maybe<Scalars['String']['output']>;
  usage?: Maybe<GraphQlTokenUsage>;
  videoUrls?: Maybe<Array<Scalars['String']['output']>>;
};

export type GraphQlErrorEventData = {
  __typename?: 'GraphQLErrorEventData';
  details?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  source: Scalars['String']['output'];
};

export type GraphQlFileDeliverable = {
  __typename?: 'GraphQLFileDeliverable';
  authorAgentName: Scalars['String']['output'];
  filePath: Scalars['String']['output'];
  summary: Scalars['String']['output'];
  timestamp: Scalars['DateTime']['output'];
};

/** Represents the data payload for a stream event. */
export type GraphQlStreamDataPayload = GraphQlAgentOperationalPhaseTransitionData | GraphQlAssistantChunkData | GraphQlAssistantCompleteResponseData | GraphQlErrorEventData | GraphQlSystemTaskNotificationData | GraphQlToolInteractionLogEntryData | GraphQlToolInvocationApprovalRequestedData | GraphQlToolInvocationAutoExecutingData;

export type GraphQlStreamEvent = {
  __typename?: 'GraphQLStreamEvent';
  agentId?: Maybe<Scalars['String']['output']>;
  data: GraphQlStreamDataPayload;
  eventId: Scalars['String']['output'];
  eventType: StreamEventType;
  timestamp: Scalars['DateTime']['output'];
};

export type GraphQlSubTeamEventRebroadcastPayload = {
  __typename?: 'GraphQLSubTeamEventRebroadcastPayload';
  subTeamEvent: GraphQlAgentTeamStreamEvent;
  subTeamNodeName: Scalars['String']['output'];
};

export type GraphQlSystemTaskNotificationData = {
  __typename?: 'GraphQLSystemTaskNotificationData';
  content: Scalars['String']['output'];
  senderId: Scalars['String']['output'];
};

export type GraphQlTask = {
  __typename?: 'GraphQLTask';
  assigneeName: Scalars['String']['output'];
  dependencies: Array<Scalars['String']['output']>;
  description: Scalars['String']['output'];
  fileDeliverables: Array<GraphQlFileDeliverable>;
  taskId: Scalars['String']['output'];
  taskName: Scalars['String']['output'];
};

export type GraphQlTaskStatusUpdatedEvent = {
  __typename?: 'GraphQLTaskStatusUpdatedEvent';
  agentName: Scalars['String']['output'];
  deliverables?: Maybe<Array<GraphQlFileDeliverable>>;
  newStatus: TaskStatus;
  taskId: Scalars['String']['output'];
  teamId: Scalars['String']['output'];
};

export type GraphQlTasksAddedEvent = {
  __typename?: 'GraphQLTasksAddedEvent';
  tasks: Array<GraphQlTask>;
  teamId: Scalars['String']['output'];
};

export type GraphQlTokenUsage = {
  __typename?: 'GraphQLTokenUsage';
  completionCost?: Maybe<Scalars['Float']['output']>;
  completionTokens: Scalars['Int']['output'];
  promptCost?: Maybe<Scalars['Float']['output']>;
  promptTokens: Scalars['Int']['output'];
  totalCost?: Maybe<Scalars['Float']['output']>;
  totalTokens: Scalars['Int']['output'];
};

export type GraphQlToolInteractionLogEntryData = {
  __typename?: 'GraphQLToolInteractionLogEntryData';
  logEntry: Scalars['String']['output'];
  toolInvocationId: Scalars['String']['output'];
  toolName?: Maybe<Scalars['String']['output']>;
};

export type GraphQlToolInvocationApprovalRequestedData = {
  __typename?: 'GraphQLToolInvocationApprovalRequestedData';
  arguments: Scalars['JSON']['output'];
  invocationId: Scalars['String']['output'];
  toolName?: Maybe<Scalars['String']['output']>;
};

export type GraphQlToolInvocationAutoExecutingData = {
  __typename?: 'GraphQLToolInvocationAutoExecutingData';
  arguments: Scalars['JSON']['output'];
  invocationId: Scalars['String']['output'];
  toolName?: Maybe<Scalars['String']['output']>;
};

export type ImportMcpServerConfigsResult = {
  __typename?: 'ImportMcpServerConfigsResult';
  failedCount: Scalars['Int']['output'];
  importedCount: Scalars['Int']['output'];
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type MarkActivePromptInput = {
  id: Scalars['String']['input'];
};

export type McpServerConfig = {
  enabled: Scalars['Boolean']['output'];
  serverId: Scalars['String']['output'];
  toolNamePrefix?: Maybe<Scalars['String']['output']>;
  transportType: McpTransportTypeEnum;
};

/** Represents one of the possible MCP server configurations. */
export type McpServerConfigUnion = StdioMcpServerConfig | StreamableHttpMcpServerConfig;

export type McpServerInput = {
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  serverId: Scalars['String']['input'];
  stdioConfig?: InputMaybe<StdioMcpServerConfigInput>;
  streamableHttpConfig?: InputMaybe<StreamableHttpMcpServerConfigInput>;
  toolNamePrefix?: InputMaybe<Scalars['String']['input']>;
  transportType: McpTransportTypeEnum;
};

export enum McpTransportTypeEnum {
  Stdio = 'STDIO',
  StreamableHttp = 'STREAMABLE_HTTP'
}

export type Message = {
  __typename?: 'Message';
  audioUrls?: Maybe<Array<Scalars['String']['output']>>;
  contextPaths?: Maybe<Array<Scalars['String']['output']>>;
  cost?: Maybe<Scalars['Float']['output']>;
  imageUrls?: Maybe<Array<Scalars['String']['output']>>;
  message: Scalars['String']['output'];
  messageId?: Maybe<Scalars['String']['output']>;
  originalMessage?: Maybe<Scalars['String']['output']>;
  reasoning?: Maybe<Scalars['String']['output']>;
  role: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
  tokenCount?: Maybe<Scalars['Int']['output']>;
  videoUrls?: Maybe<Array<Scalars['String']['output']>>;
};

export type Model = {
  __typename?: 'Model';
  name: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type ModelDetail = {
  __typename?: 'ModelDetail';
  canonicalName: Scalars['String']['output'];
  hostUrl?: Maybe<Scalars['String']['output']>;
  modelIdentifier: Scalars['String']['output'];
  name: Scalars['String']['output'];
  provider: Scalars['String']['output'];
  runtime: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addNewPromptRevision: Prompt;
  approveToolInvocation: ApproveToolInvocationResult;
  configureMcpServer: ConfigureMcpServerResult;
  createAgentDefinition: AgentDefinition;
  createAgentTeamDefinition: AgentTeamDefinition;
  createAgentTeamInstance: CreateAgentTeamInstanceResult;
  createFileOrFolder: Scalars['String']['output'];
  createPrompt: Prompt;
  createWorkspace: WorkspaceInfo;
  deleteAgentDefinition: DeleteAgentDefinitionResult;
  deleteAgentTeamDefinition: DeleteAgentTeamDefinitionResult;
  deleteFileOrFolder: Scalars['String']['output'];
  deleteMcpServer: DeleteMcpServerResult;
  deletePrompt: DeletePromptResult;
  discoverAndRegisterMcpServerTools: DiscoverAndRegisterMcpServerToolsResult;
  executeBashCommands: CommandExecutionResult;
  importMcpServerConfigs: ImportMcpServerConfigsResult;
  markActivePrompt: Prompt;
  moveFileOrFolder: Scalars['String']['output'];
  reloadLlmModels: Scalars['String']['output'];
  renameFileOrFolder: Scalars['String']['output'];
  sendAgentUserInput: SendAgentUserInputResult;
  sendMessageToTeam: SendMessageToTeamResult;
  setLlmProviderApiKey: Scalars['String']['output'];
  syncPrompts: SyncPromptsResult;
  terminateAgentInstance: TerminateAgentInstanceResult;
  terminateAgentTeamInstance: TerminateAgentTeamInstanceResult;
  updateAgentDefinition: AgentDefinition;
  updateAgentTeamDefinition: AgentTeamDefinition;
  updatePrompt: Prompt;
  updateServerSetting: Scalars['String']['output'];
  writeFileContent: Scalars['String']['output'];
};


export type MutationAddNewPromptRevisionArgs = {
  input: AddNewPromptRevisionInput;
};


export type MutationApproveToolInvocationArgs = {
  input: ApproveToolInvocationInput;
};


export type MutationConfigureMcpServerArgs = {
  input: McpServerInput;
};


export type MutationCreateAgentDefinitionArgs = {
  input: CreateAgentDefinitionInput;
};


export type MutationCreateAgentTeamDefinitionArgs = {
  input: CreateAgentTeamDefinitionInput;
};


export type MutationCreateAgentTeamInstanceArgs = {
  input: CreateAgentTeamInstanceInput;
};


export type MutationCreateFileOrFolderArgs = {
  isFile: Scalars['Boolean']['input'];
  path: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};


export type MutationCreatePromptArgs = {
  input: CreatePromptInput;
};


export type MutationCreateWorkspaceArgs = {
  input: CreateWorkspaceInput;
};


export type MutationDeleteAgentDefinitionArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteAgentTeamDefinitionArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteFileOrFolderArgs = {
  path: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};


export type MutationDeleteMcpServerArgs = {
  serverId: Scalars['String']['input'];
};


export type MutationDeletePromptArgs = {
  input: DeletePromptInput;
};


export type MutationDiscoverAndRegisterMcpServerToolsArgs = {
  serverId: Scalars['String']['input'];
};


export type MutationExecuteBashCommandsArgs = {
  command: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};


export type MutationImportMcpServerConfigsArgs = {
  jsonString: Scalars['String']['input'];
};


export type MutationMarkActivePromptArgs = {
  input: MarkActivePromptInput;
};


export type MutationMoveFileOrFolderArgs = {
  destinationPath: Scalars['String']['input'];
  sourcePath: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};


export type MutationRenameFileOrFolderArgs = {
  newName: Scalars['String']['input'];
  targetPath: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};


export type MutationSendAgentUserInputArgs = {
  input: SendAgentUserInputInput;
};


export type MutationSendMessageToTeamArgs = {
  input: SendMessageToTeamInput;
};


export type MutationSetLlmProviderApiKeyArgs = {
  apiKey: Scalars['String']['input'];
  provider: Scalars['String']['input'];
};


export type MutationTerminateAgentInstanceArgs = {
  id: Scalars['String']['input'];
};


export type MutationTerminateAgentTeamInstanceArgs = {
  id: Scalars['String']['input'];
};


export type MutationUpdateAgentDefinitionArgs = {
  input: UpdateAgentDefinitionInput;
};


export type MutationUpdateAgentTeamDefinitionArgs = {
  input: UpdateAgentTeamDefinitionInput;
};


export type MutationUpdatePromptArgs = {
  input: UpdatePromptInput;
};


export type MutationUpdateServerSettingArgs = {
  key: Scalars['String']['input'];
  value: Scalars['String']['input'];
};


export type MutationWriteFileContentArgs = {
  content: Scalars['String']['input'];
  filePath: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};

export type ParameterDefinition = {
  __typename?: 'ParameterDefinition';
  defaultValue?: Maybe<Scalars['JSON']['output']>;
  description: Scalars['String']['output'];
  name: Scalars['String']['output'];
  required: Scalars['Boolean']['output'];
  type: ParameterType;
};

export enum ParameterType {
  Boolean = 'BOOLEAN',
  Float = 'FLOAT',
  Integer = 'INTEGER',
  Json = 'JSON',
  String = 'STRING'
}

export type Prompt = {
  __typename?: 'Prompt';
  category: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  isActive: Scalars['Boolean']['output'];
  isForAgentTeam: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  parentPromptId?: Maybe<Scalars['String']['output']>;
  promptContent: Scalars['String']['output'];
  suitableForModels?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type PromptCategory = {
  __typename?: 'PromptCategory';
  category: Scalars['String']['output'];
  names: Array<Scalars['String']['output']>;
};

export type PromptDetails = {
  __typename?: 'PromptDetails';
  description?: Maybe<Scalars['String']['output']>;
  promptContent: Scalars['String']['output'];
};

export type ProviderModels = {
  __typename?: 'ProviderModels';
  models: Array<Model>;
  provider: Scalars['String']['output'];
};

export type ProviderWithModels = {
  __typename?: 'ProviderWithModels';
  models: Array<ModelDetail>;
  provider: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  agentDefinition?: Maybe<AgentDefinition>;
  agentDefinitions: Array<AgentDefinition>;
  agentInstance?: Maybe<AgentInstance>;
  agentInstances: Array<AgentInstance>;
  agentTeamDefinition?: Maybe<AgentTeamDefinition>;
  agentTeamDefinitions: Array<AgentTeamDefinition>;
  agentTeamInstance?: Maybe<AgentTeamInstance>;
  agentTeamInstances: Array<AgentTeamInstance>;
  availableInputProcessorNames: Array<Scalars['String']['output']>;
  availableLlmProvidersWithModels: Array<ProviderWithModels>;
  availableLlmResponseProcessorNames: Array<Scalars['String']['output']>;
  availablePhaseHookNames: Array<Scalars['String']['output']>;
  availablePromptCategories: Array<PromptCategory>;
  availableSystemPromptProcessorNames: Array<Scalars['String']['output']>;
  availableToolExecutionResultProcessorNames: Array<Scalars['String']['output']>;
  availableToolNames: Array<Scalars['String']['output']>;
  availableWorkspaceDefinitions: Array<WorkspaceDefinition>;
  fileContent: Scalars['String']['output'];
  getConversationHistory: ConversationHistory;
  getLlmProviderApiKey?: Maybe<Scalars['String']['output']>;
  getModelsByProvider: Array<ProviderModels>;
  getServerSettings: Array<ServerSetting>;
  mcpServers: Array<McpServerConfigUnion>;
  previewMcpServerTools: Array<ToolDefinitionDetail>;
  promptDetails?: Maybe<Prompt>;
  promptDetailsByNameAndCategory?: Maybe<PromptDetails>;
  prompts: Array<Prompt>;
  searchFiles: Array<Scalars['String']['output']>;
  tools: Array<ToolDefinitionDetail>;
  toolsGroupedByCategory: Array<ToolCategoryGroup>;
  totalCostInPeriod: Scalars['Float']['output'];
  usageStatisticsInPeriod: Array<UsageStatistics>;
  workspaces: Array<WorkspaceInfo>;
};


export type QueryAgentDefinitionArgs = {
  id: Scalars['String']['input'];
};


export type QueryAgentInstanceArgs = {
  id: Scalars['String']['input'];
};


export type QueryAgentTeamDefinitionArgs = {
  id: Scalars['String']['input'];
};


export type QueryAgentTeamInstanceArgs = {
  id: Scalars['String']['input'];
};


export type QueryFileContentArgs = {
  filePath: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};


export type QueryGetConversationHistoryArgs = {
  agentDefinitionId: Scalars['String']['input'];
  page?: Scalars['Int']['input'];
  pageSize?: Scalars['Int']['input'];
  searchQuery?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetLlmProviderApiKeyArgs = {
  provider: Scalars['String']['input'];
};


export type QueryPreviewMcpServerToolsArgs = {
  input: McpServerInput;
};


export type QueryPromptDetailsArgs = {
  id: Scalars['String']['input'];
};


export type QueryPromptDetailsByNameAndCategoryArgs = {
  category: Scalars['String']['input'];
  name: Scalars['String']['input'];
};


export type QueryPromptsArgs = {
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QuerySearchFilesArgs = {
  query: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};


export type QueryToolsArgs = {
  origin?: InputMaybe<ToolOriginEnum>;
  sourceServerId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryToolsGroupedByCategoryArgs = {
  origin: ToolOriginEnum;
};


export type QueryTotalCostInPeriodArgs = {
  endTime: Scalars['DateTime']['input'];
  startTime: Scalars['DateTime']['input'];
};


export type QueryUsageStatisticsInPeriodArgs = {
  endTime: Scalars['DateTime']['input'];
  startTime: Scalars['DateTime']['input'];
};

export type SendAgentUserInputInput = {
  agentDefinitionId?: InputMaybe<Scalars['String']['input']>;
  agentId?: InputMaybe<Scalars['String']['input']>;
  autoExecuteTools?: InputMaybe<Scalars['Boolean']['input']>;
  llmModelIdentifier?: InputMaybe<Scalars['String']['input']>;
  useXmlToolFormat?: InputMaybe<Scalars['Boolean']['input']>;
  userInput: AgentUserInput;
  workspaceId?: InputMaybe<Scalars['String']['input']>;
};

export type SendAgentUserInputResult = {
  __typename?: 'SendAgentUserInputResult';
  agentId?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type SendMessageToTeamInput = {
  memberConfigs?: InputMaybe<Array<TeamMemberConfigInput>>;
  targetNodeName?: InputMaybe<Scalars['String']['input']>;
  taskNotificationMode?: InputMaybe<TaskNotificationModeEnum>;
  teamDefinitionId?: InputMaybe<Scalars['String']['input']>;
  teamId?: InputMaybe<Scalars['String']['input']>;
  useXmlToolFormat?: InputMaybe<Scalars['Boolean']['input']>;
  userInput: AgentUserInput;
};

export type SendMessageToTeamResult = {
  __typename?: 'SendMessageToTeamResult';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
  teamId?: Maybe<Scalars['String']['output']>;
};

export type ServerSetting = {
  __typename?: 'ServerSetting';
  description: Scalars['String']['output'];
  key: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type StdioMcpServerConfig = McpServerConfig & {
  __typename?: 'StdioMcpServerConfig';
  args?: Maybe<Array<Scalars['String']['output']>>;
  command: Scalars['String']['output'];
  cwd?: Maybe<Scalars['String']['output']>;
  enabled: Scalars['Boolean']['output'];
  env?: Maybe<Scalars['JSON']['output']>;
  serverId: Scalars['String']['output'];
  toolNamePrefix?: Maybe<Scalars['String']['output']>;
  transportType: McpTransportTypeEnum;
};

export type StdioMcpServerConfigInput = {
  args?: InputMaybe<Array<Scalars['String']['input']>>;
  command: Scalars['String']['input'];
  cwd?: InputMaybe<Scalars['String']['input']>;
  env?: InputMaybe<Scalars['JSON']['input']>;
};

export enum StreamEventType {
  AgentIdle = 'AGENT_IDLE',
  AgentOperationalPhaseTransition = 'AGENT_OPERATIONAL_PHASE_TRANSITION',
  AssistantChunk = 'ASSISTANT_CHUNK',
  AssistantCompleteResponse = 'ASSISTANT_COMPLETE_RESPONSE',
  ErrorEvent = 'ERROR_EVENT',
  SystemTaskNotification = 'SYSTEM_TASK_NOTIFICATION',
  ToolInteractionLogEntry = 'TOOL_INTERACTION_LOG_ENTRY',
  ToolInvocationApprovalRequested = 'TOOL_INVOCATION_APPROVAL_REQUESTED',
  ToolInvocationAutoExecuting = 'TOOL_INVOCATION_AUTO_EXECUTING'
}

export type StreamableHttpMcpServerConfig = McpServerConfig & {
  __typename?: 'StreamableHttpMcpServerConfig';
  enabled: Scalars['Boolean']['output'];
  headers?: Maybe<Scalars['JSON']['output']>;
  serverId: Scalars['String']['output'];
  token?: Maybe<Scalars['String']['output']>;
  toolNamePrefix?: Maybe<Scalars['String']['output']>;
  transportType: McpTransportTypeEnum;
  url: Scalars['String']['output'];
};

export type StreamableHttpMcpServerConfigInput = {
  headers?: InputMaybe<Scalars['JSON']['input']>;
  token?: InputMaybe<Scalars['String']['input']>;
  url: Scalars['String']['input'];
};

export type Subscription = {
  __typename?: 'Subscription';
  agentResponse: GraphQlStreamEvent;
  agentTeamResponse: GraphQlAgentTeamStreamEvent;
  fileSystemChanged: Scalars['String']['output'];
};


export type SubscriptionAgentResponseArgs = {
  agentId: Scalars['String']['input'];
};


export type SubscriptionAgentTeamResponseArgs = {
  teamId: Scalars['String']['input'];
};


export type SubscriptionFileSystemChangedArgs = {
  workspaceId: Scalars['String']['input'];
};

export type SyncPromptsResult = {
  __typename?: 'SyncPromptsResult';
  finalCount: Scalars['Int']['output'];
  initialCount: Scalars['Int']['output'];
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
  syncedCount: Scalars['Int']['output'];
};

export enum TaskNotificationModeEnum {
  AgentManualNotification = 'AGENT_MANUAL_NOTIFICATION',
  SystemEventDriven = 'SYSTEM_EVENT_DRIVEN'
}

export enum TaskStatus {
  Blocked = 'BLOCKED',
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  InProgress = 'IN_PROGRESS',
  NotStarted = 'NOT_STARTED'
}

export type TeamMember = {
  __typename?: 'TeamMember';
  dependencies: Array<Scalars['String']['output']>;
  memberName: Scalars['String']['output'];
  referenceId: Scalars['String']['output'];
  referenceType: TeamMemberType;
};

export type TeamMemberConfigInput = {
  autoExecuteTools: Scalars['Boolean']['input'];
  llmModelIdentifier: Scalars['String']['input'];
  memberName: Scalars['String']['input'];
  workspaceId?: InputMaybe<Scalars['String']['input']>;
};

export type TeamMemberInput = {
  dependencies?: InputMaybe<Array<Scalars['String']['input']>>;
  memberName: Scalars['String']['input'];
  referenceId: Scalars['String']['input'];
  referenceType: TeamMemberType;
};

export enum TeamMemberType {
  Agent = 'AGENT',
  AgentTeam = 'AGENT_TEAM'
}

export type TerminateAgentInstanceResult = {
  __typename?: 'TerminateAgentInstanceResult';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type TerminateAgentTeamInstanceResult = {
  __typename?: 'TerminateAgentTeamInstanceResult';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type ToolArgumentSchema = {
  __typename?: 'ToolArgumentSchema';
  parameters: Array<ToolParameterDefinition>;
};

export type ToolCategoryGroup = {
  __typename?: 'ToolCategoryGroup';
  categoryName: Scalars['String']['output'];
  tools: Array<ToolDefinitionDetail>;
};

export type ToolDefinitionDetail = {
  __typename?: 'ToolDefinitionDetail';
  argumentSchema?: Maybe<ToolArgumentSchema>;
  category: Scalars['String']['output'];
  description: Scalars['String']['output'];
  name: Scalars['String']['output'];
  origin: ToolOriginEnum;
};

export enum ToolOriginEnum {
  Local = 'LOCAL',
  Mcp = 'MCP'
}

export type ToolParameterDefinition = {
  __typename?: 'ToolParameterDefinition';
  defaultValue?: Maybe<Scalars['String']['output']>;
  description: Scalars['String']['output'];
  enumValues?: Maybe<Array<Scalars['String']['output']>>;
  name: Scalars['String']['output'];
  paramType: ToolParameterTypeEnum;
  required: Scalars['Boolean']['output'];
};

export enum ToolParameterTypeEnum {
  Array = 'ARRAY',
  Boolean = 'BOOLEAN',
  Enum = 'ENUM',
  Float = 'FLOAT',
  Integer = 'INTEGER',
  Object = 'OBJECT',
  String = 'STRING'
}

export type UpdateAgentDefinitionInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  inputProcessorNames?: InputMaybe<Array<Scalars['String']['input']>>;
  llmResponseProcessorNames?: InputMaybe<Array<Scalars['String']['input']>>;
  name?: InputMaybe<Scalars['String']['input']>;
  phaseHookNames?: InputMaybe<Array<Scalars['String']['input']>>;
  role?: InputMaybe<Scalars['String']['input']>;
  systemPromptCategory?: InputMaybe<Scalars['String']['input']>;
  systemPromptName?: InputMaybe<Scalars['String']['input']>;
  systemPromptProcessorNames?: InputMaybe<Array<Scalars['String']['input']>>;
  toolExecutionResultProcessorNames?: InputMaybe<Array<Scalars['String']['input']>>;
  toolNames?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type UpdateAgentTeamDefinitionInput = {
  coordinatorMemberName?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  nodes?: InputMaybe<Array<TeamMemberInput>>;
  role?: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePromptInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  promptContent?: InputMaybe<Scalars['String']['input']>;
  suitableForModels?: InputMaybe<Scalars['String']['input']>;
};

export type UsageStatistics = {
  __typename?: 'UsageStatistics';
  assistantCost?: Maybe<Scalars['Float']['output']>;
  assistantTokens: Scalars['Int']['output'];
  llmModel: Scalars['String']['output'];
  promptCost?: Maybe<Scalars['Float']['output']>;
  promptTokens: Scalars['Int']['output'];
  totalCost?: Maybe<Scalars['Float']['output']>;
};

export type WorkspaceDefinition = {
  __typename?: 'WorkspaceDefinition';
  configSchema: Array<ParameterDefinition>;
  description: Scalars['String']['output'];
  workspaceTypeName: Scalars['String']['output'];
};

export type WorkspaceInfo = {
  __typename?: 'WorkspaceInfo';
  absolutePath?: Maybe<Scalars['String']['output']>;
  config: Scalars['JSON']['output'];
  fileExplorer?: Maybe<Scalars['JSON']['output']>;
  name: Scalars['String']['output'];
  workspaceId: Scalars['String']['output'];
  workspaceTypeName: Scalars['String']['output'];
};

export type CreateAgentDefinitionMutationVariables = Exact<{
  input: CreateAgentDefinitionInput;
}>;


export type CreateAgentDefinitionMutation = { __typename?: 'Mutation', createAgentDefinition: { __typename: 'AgentDefinition', id: string, name: string, role: string, description: string, toolNames: Array<string>, inputProcessorNames: Array<string>, llmResponseProcessorNames: Array<string>, systemPromptProcessorNames: Array<string>, toolExecutionResultProcessorNames: Array<string>, phaseHookNames: Array<string>, systemPromptCategory?: string | null, systemPromptName?: string | null, prompts: Array<{ __typename: 'Prompt', id: string, name: string, category: string }> } };

export type UpdateAgentDefinitionMutationVariables = Exact<{
  input: UpdateAgentDefinitionInput;
}>;


export type UpdateAgentDefinitionMutation = { __typename?: 'Mutation', updateAgentDefinition: { __typename: 'AgentDefinition', id: string, name: string, role: string, description: string, toolNames: Array<string>, inputProcessorNames: Array<string>, llmResponseProcessorNames: Array<string>, systemPromptProcessorNames: Array<string>, toolExecutionResultProcessorNames: Array<string>, phaseHookNames: Array<string>, systemPromptCategory?: string | null, systemPromptName?: string | null } };

export type DeleteAgentDefinitionMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteAgentDefinitionMutation = { __typename?: 'Mutation', deleteAgentDefinition: { __typename: 'DeleteAgentDefinitionResult', success: boolean, message: string } };

export type TerminateAgentInstanceMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type TerminateAgentInstanceMutation = { __typename?: 'Mutation', terminateAgentInstance: { __typename: 'TerminateAgentInstanceResult', success: boolean, message: string } };

export type SendAgentUserInputMutationVariables = Exact<{
  input: SendAgentUserInputInput;
}>;


export type SendAgentUserInputMutation = { __typename?: 'Mutation', sendAgentUserInput: { __typename: 'SendAgentUserInputResult', success: boolean, message: string, agentId?: string | null } };

export type ApproveToolInvocationMutationVariables = Exact<{
  input: ApproveToolInvocationInput;
}>;


export type ApproveToolInvocationMutation = { __typename?: 'Mutation', approveToolInvocation: { __typename: 'ApproveToolInvocationResult', success: boolean, message: string } };

export type CreateAgentTeamDefinitionMutationVariables = Exact<{
  input: CreateAgentTeamDefinitionInput;
}>;


export type CreateAgentTeamDefinitionMutation = { __typename?: 'Mutation', createAgentTeamDefinition: { __typename: 'AgentTeamDefinition', id: string, name: string } };

export type UpdateAgentTeamDefinitionMutationVariables = Exact<{
  input: UpdateAgentTeamDefinitionInput;
}>;


export type UpdateAgentTeamDefinitionMutation = { __typename?: 'Mutation', updateAgentTeamDefinition: { __typename: 'AgentTeamDefinition', id: string, name: string } };

export type DeleteAgentTeamDefinitionMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteAgentTeamDefinitionMutation = { __typename?: 'Mutation', deleteAgentTeamDefinition: { __typename: 'DeleteAgentTeamDefinitionResult', success: boolean, message: string } };

export type CreateAgentTeamInstanceMutationVariables = Exact<{
  input: CreateAgentTeamInstanceInput;
}>;


export type CreateAgentTeamInstanceMutation = { __typename?: 'Mutation', createAgentTeamInstance: { __typename: 'CreateAgentTeamInstanceResult', success: boolean, message: string, teamId?: string | null } };

export type TerminateAgentTeamInstanceMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type TerminateAgentTeamInstanceMutation = { __typename?: 'Mutation', terminateAgentTeamInstance: { __typename: 'TerminateAgentTeamInstanceResult', success: boolean, message: string } };

export type SendMessageToTeamMutationVariables = Exact<{
  input: SendMessageToTeamInput;
}>;


export type SendMessageToTeamMutation = { __typename?: 'Mutation', sendMessageToTeam: { __typename: 'SendMessageToTeamResult', success: boolean, message: string, teamId?: string | null } };

export type WriteFileContentMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  filePath: Scalars['String']['input'];
  content: Scalars['String']['input'];
}>;


export type WriteFileContentMutation = { __typename?: 'Mutation', writeFileContent: string };

export type DeleteFileOrFolderMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  path: Scalars['String']['input'];
}>;


export type DeleteFileOrFolderMutation = { __typename?: 'Mutation', deleteFileOrFolder: string };

export type MoveFileOrFolderMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  sourcePath: Scalars['String']['input'];
  destinationPath: Scalars['String']['input'];
}>;


export type MoveFileOrFolderMutation = { __typename?: 'Mutation', moveFileOrFolder: string };

export type RenameFileOrFolderMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  targetPath: Scalars['String']['input'];
  newName: Scalars['String']['input'];
}>;


export type RenameFileOrFolderMutation = { __typename?: 'Mutation', renameFileOrFolder: string };

export type CreateFileOrFolderMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  path: Scalars['String']['input'];
  isFile: Scalars['Boolean']['input'];
}>;


export type CreateFileOrFolderMutation = { __typename?: 'Mutation', createFileOrFolder: string };

export type SetLlmProviderApiKeyMutationVariables = Exact<{
  provider: Scalars['String']['input'];
  apiKey: Scalars['String']['input'];
}>;


export type SetLlmProviderApiKeyMutation = { __typename?: 'Mutation', setLlmProviderApiKey: string };

export type ReloadLlmModelsMutationVariables = Exact<{ [key: string]: never; }>;


export type ReloadLlmModelsMutation = { __typename?: 'Mutation', reloadLlmModels: string };

export type ConfigureMcpServerMutationVariables = Exact<{
  input: McpServerInput;
}>;


export type ConfigureMcpServerMutation = { __typename?: 'Mutation', configureMcpServer: { __typename?: 'ConfigureMcpServerResult', savedConfig: { __typename: 'StdioMcpServerConfig', serverId: string, transportType: McpTransportTypeEnum, enabled: boolean, toolNamePrefix?: string | null, command: string, args?: Array<string> | null, env?: any | null, cwd?: string | null } | { __typename: 'StreamableHttpMcpServerConfig', serverId: string, transportType: McpTransportTypeEnum, enabled: boolean, toolNamePrefix?: string | null, url: string, token?: string | null, headers?: any | null } } };

export type DeleteMcpServerMutationVariables = Exact<{
  serverId: Scalars['String']['input'];
}>;


export type DeleteMcpServerMutation = { __typename?: 'Mutation', deleteMcpServer: { __typename: 'DeleteMcpServerResult', success: boolean, message: string } };

export type DiscoverAndRegisterMcpServerToolsMutationVariables = Exact<{
  serverId: Scalars['String']['input'];
}>;


export type DiscoverAndRegisterMcpServerToolsMutation = { __typename?: 'Mutation', discoverAndRegisterMcpServerTools: { __typename: 'DiscoverAndRegisterMcpServerToolsResult', success: boolean, message: string, discoveredTools: Array<{ __typename: 'ToolDefinitionDetail', name: string, description: string, origin: ToolOriginEnum, category: string, argumentSchema?: { __typename: 'ToolArgumentSchema', parameters: Array<{ __typename: 'ToolParameterDefinition', name: string, paramType: ToolParameterTypeEnum, description: string, required: boolean, defaultValue?: string | null, enumValues?: Array<string> | null }> } | null }> } };

export type ImportMcpServerConfigsMutationVariables = Exact<{
  jsonString: Scalars['String']['input'];
}>;


export type ImportMcpServerConfigsMutation = { __typename?: 'Mutation', importMcpServerConfigs: { __typename: 'ImportMcpServerConfigsResult', success: boolean, message: string, importedCount: number, failedCount: number } };

export type CreatePromptMutationVariables = Exact<{
  input: CreatePromptInput;
}>;


export type CreatePromptMutation = { __typename?: 'Mutation', createPrompt: { __typename: 'Prompt', id: string, name: string, category: string, promptContent: string, description?: string | null, suitableForModels?: string | null, version: number, createdAt: any, parentPromptId?: string | null, isActive: boolean, isForAgentTeam: boolean } };

export type UpdatePromptMutationVariables = Exact<{
  input: UpdatePromptInput;
}>;


export type UpdatePromptMutation = { __typename?: 'Mutation', updatePrompt: { __typename: 'Prompt', id: string, name: string, category: string, promptContent: string, description?: string | null, suitableForModels?: string | null, version: number, createdAt: any, updatedAt: any, parentPromptId?: string | null, isActive: boolean, isForAgentTeam: boolean } };

export type AddNewPromptRevisionMutationVariables = Exact<{
  input: AddNewPromptRevisionInput;
}>;


export type AddNewPromptRevisionMutation = { __typename?: 'Mutation', addNewPromptRevision: { __typename: 'Prompt', id: string, name: string, category: string, promptContent: string, description?: string | null, suitableForModels?: string | null, version: number, createdAt: any, parentPromptId?: string | null, isActive: boolean, isForAgentTeam: boolean } };

export type MarkActivePromptMutationVariables = Exact<{
  input: MarkActivePromptInput;
}>;


export type MarkActivePromptMutation = { __typename?: 'Mutation', markActivePrompt: { __typename: 'Prompt', id: string, isActive: boolean } };

export type SyncPromptsMutationVariables = Exact<{ [key: string]: never; }>;


export type SyncPromptsMutation = { __typename?: 'Mutation', syncPrompts: { __typename: 'SyncPromptsResult', success: boolean, message: string, initialCount: number, finalCount: number, syncedCount: number } };

export type DeletePromptMutationVariables = Exact<{
  input: DeletePromptInput;
}>;


export type DeletePromptMutation = { __typename?: 'Mutation', deletePrompt: { __typename: 'DeletePromptResult', success: boolean, message: string } };

export type UpdateServerSettingMutationVariables = Exact<{
  key: Scalars['String']['input'];
  value: Scalars['String']['input'];
}>;


export type UpdateServerSettingMutation = { __typename?: 'Mutation', updateServerSetting: string };

export type CreateWorkspaceMutationVariables = Exact<{
  input: CreateWorkspaceInput;
}>;


export type CreateWorkspaceMutation = { __typename?: 'Mutation', createWorkspace: { __typename: 'WorkspaceInfo', workspaceId: string, name: string, fileExplorer?: any | null, absolutePath?: string | null } };

export type ExecuteBashCommandsMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  command: Scalars['String']['input'];
}>;


export type ExecuteBashCommandsMutation = { __typename?: 'Mutation', executeBashCommands: { __typename: 'CommandExecutionResult', success: boolean, message: string } };

export type GetAgentCustomizationOptionsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAgentCustomizationOptionsQuery = { __typename?: 'Query', availableToolNames: Array<string>, availableInputProcessorNames: Array<string>, availableLlmResponseProcessorNames: Array<string>, availableSystemPromptProcessorNames: Array<string>, availableToolExecutionResultProcessorNames: Array<string>, availablePhaseHookNames: Array<string>, availablePromptCategories: Array<{ __typename: 'PromptCategory', category: string, names: Array<string> }> };

export type GetAgentDefinitionsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAgentDefinitionsQuery = { __typename?: 'Query', agentDefinitions: Array<{ __typename: 'AgentDefinition', id: string, name: string, role: string, description: string, toolNames: Array<string>, inputProcessorNames: Array<string>, llmResponseProcessorNames: Array<string>, systemPromptProcessorNames: Array<string>, toolExecutionResultProcessorNames: Array<string>, phaseHookNames: Array<string>, systemPromptCategory?: string | null, systemPromptName?: string | null, prompts: Array<{ __typename: 'Prompt', id: string, name: string, category: string, promptContent: string, description?: string | null, suitableForModels?: string | null, version: number, createdAt: any, updatedAt: any, parentPromptId?: string | null, isActive: boolean, isForAgentTeam: boolean }> }> };

export type GetAgentInstancesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAgentInstancesQuery = { __typename?: 'Query', agentInstances: Array<{ __typename: 'AgentInstance', id: string, name: string, role: string, currentPhase: string, agentDefinitionId?: string | null, workspace?: { __typename: 'WorkspaceInfo', workspaceId: string, name: string, workspaceTypeName: string, config: any } | null }> };

export type GetAgentTeamDefinitionsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAgentTeamDefinitionsQuery = { __typename?: 'Query', agentTeamDefinitions: Array<{ __typename: 'AgentTeamDefinition', id: string, name: string, description: string, role?: string | null, coordinatorMemberName: string, nodes: Array<{ __typename: 'TeamMember', memberName: string, referenceId: string, referenceType: TeamMemberType, dependencies: Array<string> }> }> };

export type GetConversationHistoryQueryVariables = Exact<{
  agentDefinitionId: Scalars['String']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  searchQuery?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetConversationHistoryQuery = { __typename?: 'Query', getConversationHistory: { __typename: 'ConversationHistory', totalPages: number, currentPage: number, conversations: Array<{ __typename: 'AgentConversation', agentId: string, agentDefinitionId: string, createdAt: string, llmModel?: string | null, useXmlToolFormat: boolean, messages: Array<{ __typename: 'Message', messageId?: string | null, role: string, message: string, timestamp: string, contextPaths?: Array<string> | null, originalMessage?: string | null, tokenCount?: number | null, cost?: number | null, reasoning?: string | null, imageUrls?: Array<string> | null, audioUrls?: Array<string> | null, videoUrls?: Array<string> | null }> }> } };

export type GetFileContentQueryVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  filePath: Scalars['String']['input'];
}>;


export type GetFileContentQuery = { __typename?: 'Query', fileContent: string };

export type SearchFilesQueryVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  query: Scalars['String']['input'];
}>;


export type SearchFilesQuery = { __typename?: 'Query', searchFiles: Array<string> };

export type GetLlmProviderApiKeyQueryVariables = Exact<{
  provider: Scalars['String']['input'];
}>;


export type GetLlmProviderApiKeyQuery = { __typename?: 'Query', getLlmProviderApiKey?: string | null };

export type GetAvailableLlmProvidersWithModelsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAvailableLlmProvidersWithModelsQuery = { __typename?: 'Query', availableLlmProvidersWithModels: Array<{ __typename: 'ProviderWithModels', provider: string, models: Array<{ __typename: 'ModelDetail', modelIdentifier: string, name: string, value: string, canonicalName: string }> }> };

export type GetMcpServersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMcpServersQuery = { __typename?: 'Query', mcpServers: Array<{ __typename: 'StdioMcpServerConfig', serverId: string, transportType: McpTransportTypeEnum, enabled: boolean, toolNamePrefix?: string | null, command: string, args?: Array<string> | null, env?: any | null, cwd?: string | null } | { __typename: 'StreamableHttpMcpServerConfig', serverId: string, transportType: McpTransportTypeEnum, enabled: boolean, toolNamePrefix?: string | null, url: string, token?: string | null, headers?: any | null }> };

export type PreviewMcpServerToolsQueryVariables = Exact<{
  input: McpServerInput;
}>;


export type PreviewMcpServerToolsQuery = { __typename?: 'Query', previewMcpServerTools: Array<{ __typename: 'ToolDefinitionDetail', name: string, description: string }> };

export type GetPromptsQueryVariables = Exact<{
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetPromptsQuery = { __typename?: 'Query', prompts: Array<{ __typename: 'Prompt', id: string, name: string, category: string, promptContent: string, description?: string | null, suitableForModels?: string | null, version: number, createdAt: any, updatedAt: any, parentPromptId?: string | null, isActive: boolean, isForAgentTeam: boolean }> };

export type GetPromptByIdQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetPromptByIdQuery = { __typename?: 'Query', promptDetails?: { __typename: 'Prompt', id: string, name: string, category: string, promptContent: string, description?: string | null, suitableForModels?: string | null, version: number, createdAt: any, updatedAt: any, parentPromptId?: string | null, isActive: boolean, isForAgentTeam: boolean } | null };

export type GetPromptDetailsByNameAndCategoryQueryVariables = Exact<{
  category: Scalars['String']['input'];
  name: Scalars['String']['input'];
}>;


export type GetPromptDetailsByNameAndCategoryQuery = { __typename?: 'Query', promptDetailsByNameAndCategory?: { __typename: 'PromptDetails', description?: string | null, promptContent: string } | null };

export type GetServerSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetServerSettingsQuery = { __typename?: 'Query', getServerSettings: Array<{ __typename: 'ServerSetting', key: string, value: string, description: string }> };

export type GetUsageStatisticsInPeriodQueryVariables = Exact<{
  startTime: Scalars['DateTime']['input'];
  endTime: Scalars['DateTime']['input'];
}>;


export type GetUsageStatisticsInPeriodQuery = { __typename?: 'Query', usageStatisticsInPeriod: Array<{ __typename?: 'UsageStatistics', llmModel: string, promptTokens: number, assistantTokens: number, promptCost?: number | null, assistantCost?: number | null, totalCost?: number | null }> };

export type GetToolsQueryVariables = Exact<{
  origin?: InputMaybe<ToolOriginEnum>;
  sourceServerId?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetToolsQuery = { __typename?: 'Query', tools: Array<{ __typename: 'ToolDefinitionDetail', name: string, description: string, origin: ToolOriginEnum, category: string, argumentSchema?: { __typename: 'ToolArgumentSchema', parameters: Array<{ __typename: 'ToolParameterDefinition', name: string, paramType: ToolParameterTypeEnum, description: string, required: boolean, defaultValue?: string | null, enumValues?: Array<string> | null }> } | null }> };

export type GetToolsGroupedByCategoryQueryVariables = Exact<{
  origin: ToolOriginEnum;
}>;


export type GetToolsGroupedByCategoryQuery = { __typename?: 'Query', toolsGroupedByCategory: Array<{ __typename: 'ToolCategoryGroup', categoryName: string, tools: Array<{ __typename: 'ToolDefinitionDetail', name: string, description: string, origin: ToolOriginEnum, category: string, argumentSchema?: { __typename: 'ToolArgumentSchema', parameters: Array<{ __typename: 'ToolParameterDefinition', name: string, paramType: ToolParameterTypeEnum, description: string, required: boolean, defaultValue?: string | null, enumValues?: Array<string> | null }> } | null }> }> };

export type GetAvailableWorkspaceDefinitionsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAvailableWorkspaceDefinitionsQuery = { __typename?: 'Query', availableWorkspaceDefinitions: Array<{ __typename: 'WorkspaceDefinition', workspaceTypeName: string, description: string, configSchema: Array<{ __typename: 'ParameterDefinition', name: string, type: ParameterType, description: string, required: boolean, defaultValue?: any | null }> }> };

export type GetAllWorkspacesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAllWorkspacesQuery = { __typename?: 'Query', workspaces: Array<{ __typename: 'WorkspaceInfo', workspaceId: string, name: string, workspaceTypeName: string, config: any, fileExplorer?: any | null, absolutePath?: string | null }> };

export type NestedTeamEventFragment = { __typename?: 'GraphQLAgentTeamStreamEvent', eventId: string, timestamp: any, teamId: string, eventSourceType: AgentTeamEventSourceType, data: { __typename: 'GraphQLAgentEventRebroadcastPayload', agentName: string, agentEvent: { __typename?: 'GraphQLStreamEvent', eventId: string, timestamp: any, eventType: StreamEventType, agentId?: string | null, data: { __typename: 'GraphQLAgentOperationalPhaseTransitionData', newPhase: AgentOperationalPhase, oldPhase?: AgentOperationalPhase | null, trigger?: string | null, toolName?: string | null, errorMessage?: string | null, errorDetails?: string | null } | { __typename: 'GraphQLAssistantChunkData', content: string, reasoning?: string | null, isComplete: boolean, imageUrls?: Array<string> | null, audioUrls?: Array<string> | null, videoUrls?: Array<string> | null, usage?: { __typename?: 'GraphQLTokenUsage', promptTokens: number, completionTokens: number, totalTokens: number, promptCost?: number | null, completionCost?: number | null, totalCost?: number | null } | null } | { __typename: 'GraphQLAssistantCompleteResponseData', content: string, reasoning?: string | null, imageUrls?: Array<string> | null, audioUrls?: Array<string> | null, videoUrls?: Array<string> | null, usage?: { __typename?: 'GraphQLTokenUsage', promptTokens: number, completionTokens: number, totalTokens: number, promptCost?: number | null, completionCost?: number | null, totalCost?: number | null } | null } | { __typename: 'GraphQLErrorEventData', source: string, message: string, details?: string | null } | { __typename: 'GraphQLSystemTaskNotificationData', senderId: string, content: string } | { __typename: 'GraphQLToolInteractionLogEntryData', logEntry: string, toolInvocationId: string, toolName?: string | null } | { __typename: 'GraphQLToolInvocationApprovalRequestedData', invocationId: string, toolName?: string | null, arguments: any } | { __typename: 'GraphQLToolInvocationAutoExecutingData', invocationId: string, toolName?: string | null, arguments: any } } } | { __typename: 'GraphQLAgentTeamPhaseTransitionData', newPhase: AgentTeamOperationalPhase, oldPhase?: AgentTeamOperationalPhase | null, errorMessage?: string | null } | { __typename: 'GraphQLSubTeamEventRebroadcastPayload' } | { __typename: 'GraphQLTaskStatusUpdatedEvent', teamId: string, taskId: string, newStatus: TaskStatus, agentName: string, deliverables?: Array<{ __typename?: 'GraphQLFileDeliverable', filePath: string, summary: string, authorAgentName: string, timestamp: any }> | null } | { __typename: 'GraphQLTasksAddedEvent', teamId: string, tasks: Array<{ __typename?: 'GraphQLTask', taskId: string, taskName: string, assigneeName: string, description: string, dependencies: Array<string>, fileDeliverables: Array<{ __typename?: 'GraphQLFileDeliverable', filePath: string, summary: string, authorAgentName: string, timestamp: any }> }> } };

export type AgentTeamResponseSubscriptionVariables = Exact<{
  teamId: Scalars['String']['input'];
}>;


export type AgentTeamResponseSubscription = { __typename?: 'Subscription', agentTeamResponse: { __typename?: 'GraphQLAgentTeamStreamEvent', eventId: string, timestamp: any, teamId: string, eventSourceType: AgentTeamEventSourceType, data: { __typename: 'GraphQLAgentEventRebroadcastPayload', agentName: string, agentEvent: { __typename?: 'GraphQLStreamEvent', eventId: string, timestamp: any, eventType: StreamEventType, agentId?: string | null, data: { __typename: 'GraphQLAgentOperationalPhaseTransitionData', newPhase: AgentOperationalPhase, oldPhase?: AgentOperationalPhase | null, trigger?: string | null, toolName?: string | null, errorMessage?: string | null, errorDetails?: string | null } | { __typename: 'GraphQLAssistantChunkData', content: string, reasoning?: string | null, isComplete: boolean, imageUrls?: Array<string> | null, audioUrls?: Array<string> | null, videoUrls?: Array<string> | null, usage?: { __typename?: 'GraphQLTokenUsage', promptTokens: number, completionTokens: number, totalTokens: number, promptCost?: number | null, completionCost?: number | null, totalCost?: number | null } | null } | { __typename: 'GraphQLAssistantCompleteResponseData', content: string, reasoning?: string | null, imageUrls?: Array<string> | null, audioUrls?: Array<string> | null, videoUrls?: Array<string> | null, usage?: { __typename?: 'GraphQLTokenUsage', promptTokens: number, completionTokens: number, totalTokens: number, promptCost?: number | null, completionCost?: number | null, totalCost?: number | null } | null } | { __typename: 'GraphQLErrorEventData', source: string, message: string, details?: string | null } | { __typename: 'GraphQLSystemTaskNotificationData', senderId: string, content: string } | { __typename: 'GraphQLToolInteractionLogEntryData', logEntry: string, toolInvocationId: string, toolName?: string | null } | { __typename: 'GraphQLToolInvocationApprovalRequestedData', invocationId: string, toolName?: string | null, arguments: any } | { __typename: 'GraphQLToolInvocationAutoExecutingData', invocationId: string, toolName?: string | null, arguments: any } } } | { __typename: 'GraphQLAgentTeamPhaseTransitionData', newPhase: AgentTeamOperationalPhase, oldPhase?: AgentTeamOperationalPhase | null, errorMessage?: string | null } | { __typename: 'GraphQLSubTeamEventRebroadcastPayload', subTeamNodeName: string, subTeamEvent: { __typename?: 'GraphQLAgentTeamStreamEvent', eventId: string, timestamp: any, teamId: string, eventSourceType: AgentTeamEventSourceType, data: { __typename: 'GraphQLAgentEventRebroadcastPayload', agentName: string, agentEvent: { __typename?: 'GraphQLStreamEvent', eventId: string, timestamp: any, eventType: StreamEventType, agentId?: string | null, data: { __typename: 'GraphQLAgentOperationalPhaseTransitionData', newPhase: AgentOperationalPhase, oldPhase?: AgentOperationalPhase | null, trigger?: string | null, toolName?: string | null, errorMessage?: string | null, errorDetails?: string | null } | { __typename: 'GraphQLAssistantChunkData', content: string, reasoning?: string | null, isComplete: boolean, imageUrls?: Array<string> | null, audioUrls?: Array<string> | null, videoUrls?: Array<string> | null, usage?: { __typename?: 'GraphQLTokenUsage', promptTokens: number, completionTokens: number, totalTokens: number, promptCost?: number | null, completionCost?: number | null, totalCost?: number | null } | null } | { __typename: 'GraphQLAssistantCompleteResponseData', content: string, reasoning?: string | null, imageUrls?: Array<string> | null, audioUrls?: Array<string> | null, videoUrls?: Array<string> | null, usage?: { __typename?: 'GraphQLTokenUsage', promptTokens: number, completionTokens: number, totalTokens: number, promptCost?: number | null, completionCost?: number | null, totalCost?: number | null } | null } | { __typename: 'GraphQLErrorEventData', source: string, message: string, details?: string | null } | { __typename: 'GraphQLSystemTaskNotificationData', senderId: string, content: string } | { __typename: 'GraphQLToolInteractionLogEntryData', logEntry: string, toolInvocationId: string, toolName?: string | null } | { __typename: 'GraphQLToolInvocationApprovalRequestedData', invocationId: string, toolName?: string | null, arguments: any } | { __typename: 'GraphQLToolInvocationAutoExecutingData', invocationId: string, toolName?: string | null, arguments: any } } } | { __typename: 'GraphQLAgentTeamPhaseTransitionData', newPhase: AgentTeamOperationalPhase, oldPhase?: AgentTeamOperationalPhase | null, errorMessage?: string | null } | { __typename: 'GraphQLSubTeamEventRebroadcastPayload', subTeamNodeName: string, subTeamEvent: { __typename?: 'GraphQLAgentTeamStreamEvent', eventId: string, timestamp: any, teamId: string, eventSourceType: AgentTeamEventSourceType, data: { __typename: 'GraphQLAgentEventRebroadcastPayload', agentName: string, agentEvent: { __typename?: 'GraphQLStreamEvent', eventId: string, timestamp: any, eventType: StreamEventType, agentId?: string | null, data: { __typename: 'GraphQLAgentOperationalPhaseTransitionData', newPhase: AgentOperationalPhase, oldPhase?: AgentOperationalPhase | null, trigger?: string | null, toolName?: string | null, errorMessage?: string | null, errorDetails?: string | null } | { __typename: 'GraphQLAssistantChunkData', content: string, reasoning?: string | null, isComplete: boolean, imageUrls?: Array<string> | null, audioUrls?: Array<string> | null, videoUrls?: Array<string> | null, usage?: { __typename?: 'GraphQLTokenUsage', promptTokens: number, completionTokens: number, totalTokens: number, promptCost?: number | null, completionCost?: number | null, totalCost?: number | null } | null } | { __typename: 'GraphQLAssistantCompleteResponseData', content: string, reasoning?: string | null, imageUrls?: Array<string> | null, audioUrls?: Array<string> | null, videoUrls?: Array<string> | null, usage?: { __typename?: 'GraphQLTokenUsage', promptTokens: number, completionTokens: number, totalTokens: number, promptCost?: number | null, completionCost?: number | null, totalCost?: number | null } | null } | { __typename: 'GraphQLErrorEventData', source: string, message: string, details?: string | null } | { __typename: 'GraphQLSystemTaskNotificationData', senderId: string, content: string } | { __typename: 'GraphQLToolInteractionLogEntryData', logEntry: string, toolInvocationId: string, toolName?: string | null } | { __typename: 'GraphQLToolInvocationApprovalRequestedData', invocationId: string, toolName?: string | null, arguments: any } | { __typename: 'GraphQLToolInvocationAutoExecutingData', invocationId: string, toolName?: string | null, arguments: any } } } | { __typename: 'GraphQLAgentTeamPhaseTransitionData', newPhase: AgentTeamOperationalPhase, oldPhase?: AgentTeamOperationalPhase | null, errorMessage?: string | null } | { __typename: 'GraphQLSubTeamEventRebroadcastPayload' } | { __typename: 'GraphQLTaskStatusUpdatedEvent', teamId: string, taskId: string, newStatus: TaskStatus, agentName: string, deliverables?: Array<{ __typename?: 'GraphQLFileDeliverable', filePath: string, summary: string, authorAgentName: string, timestamp: any }> | null } | { __typename: 'GraphQLTasksAddedEvent', teamId: string, tasks: Array<{ __typename?: 'GraphQLTask', taskId: string, taskName: string, assigneeName: string, description: string, dependencies: Array<string>, fileDeliverables: Array<{ __typename?: 'GraphQLFileDeliverable', filePath: string, summary: string, authorAgentName: string, timestamp: any }> }> } } } | { __typename: 'GraphQLTaskStatusUpdatedEvent', teamId: string, taskId: string, newStatus: TaskStatus, agentName: string, deliverables?: Array<{ __typename?: 'GraphQLFileDeliverable', filePath: string, summary: string, authorAgentName: string, timestamp: any }> | null } | { __typename: 'GraphQLTasksAddedEvent', teamId: string, tasks: Array<{ __typename?: 'GraphQLTask', taskId: string, taskName: string, assigneeName: string, description: string, dependencies: Array<string>, fileDeliverables: Array<{ __typename?: 'GraphQLFileDeliverable', filePath: string, summary: string, authorAgentName: string, timestamp: any }> }> } } } | { __typename: 'GraphQLTaskStatusUpdatedEvent', teamId: string, taskId: string, newStatus: TaskStatus, agentName: string, deliverables?: Array<{ __typename?: 'GraphQLFileDeliverable', filePath: string, summary: string, authorAgentName: string, timestamp: any }> | null } | { __typename: 'GraphQLTasksAddedEvent', teamId: string, tasks: Array<{ __typename?: 'GraphQLTask', taskId: string, taskName: string, assigneeName: string, description: string, dependencies: Array<string>, fileDeliverables: Array<{ __typename?: 'GraphQLFileDeliverable', filePath: string, summary: string, authorAgentName: string, timestamp: any }> }> } } };

export type AgentResponseSubscriptionVariables = Exact<{
  agentId: Scalars['String']['input'];
}>;


export type AgentResponseSubscription = { __typename?: 'Subscription', agentResponse: { __typename?: 'GraphQLStreamEvent', eventId: string, timestamp: any, eventType: StreamEventType, agentId?: string | null, data: { __typename: 'GraphQLAgentOperationalPhaseTransitionData', newPhase: AgentOperationalPhase, oldPhase?: AgentOperationalPhase | null, trigger?: string | null, toolName?: string | null, errorMessage?: string | null, errorDetails?: string | null } | { __typename: 'GraphQLAssistantChunkData', content: string, reasoning?: string | null, isComplete: boolean, imageUrls?: Array<string> | null, audioUrls?: Array<string> | null, videoUrls?: Array<string> | null, usage?: { __typename?: 'GraphQLTokenUsage', promptTokens: number, completionTokens: number, totalTokens: number, promptCost?: number | null, completionCost?: number | null, totalCost?: number | null } | null } | { __typename: 'GraphQLAssistantCompleteResponseData', content: string, reasoning?: string | null, imageUrls?: Array<string> | null, audioUrls?: Array<string> | null, videoUrls?: Array<string> | null, usage?: { __typename?: 'GraphQLTokenUsage', promptTokens: number, completionTokens: number, totalTokens: number, promptCost?: number | null, completionCost?: number | null, totalCost?: number | null } | null } | { __typename: 'GraphQLErrorEventData', source: string, message: string, details?: string | null } | { __typename: 'GraphQLSystemTaskNotificationData', senderId: string, content: string } | { __typename: 'GraphQLToolInteractionLogEntryData', logEntry: string, toolInvocationId: string, toolName?: string | null } | { __typename: 'GraphQLToolInvocationApprovalRequestedData', invocationId: string, toolName?: string | null, arguments: any } | { __typename: 'GraphQLToolInvocationAutoExecutingData', invocationId: string, toolName?: string | null, arguments: any } } };

export type FileSystemChangedSubscriptionVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type FileSystemChangedSubscription = { __typename?: 'Subscription', fileSystemChanged: string };

export const NestedTeamEventFragmentDoc = gql`
    fragment NestedTeamEvent on GraphQLAgentTeamStreamEvent {
  eventId
  timestamp
  teamId
  eventSourceType
  data {
    __typename
    ... on GraphQLAgentTeamPhaseTransitionData {
      newPhase
      oldPhase
      errorMessage
    }
    ... on GraphQLAgentEventRebroadcastPayload {
      agentName
      agentEvent {
        eventId
        timestamp
        eventType
        agentId
        data {
          __typename
          ... on GraphQLAssistantChunkData {
            content
            reasoning
            isComplete
            usage {
              promptTokens
              completionTokens
              totalTokens
              promptCost
              completionCost
              totalCost
            }
            imageUrls
            audioUrls
            videoUrls
          }
          ... on GraphQLAssistantCompleteResponseData {
            content
            reasoning
            usage {
              promptTokens
              completionTokens
              totalTokens
              promptCost
              completionCost
              totalCost
            }
            imageUrls
            audioUrls
            videoUrls
          }
          ... on GraphQLToolInteractionLogEntryData {
            logEntry
            toolInvocationId
            toolName
          }
          ... on GraphQLAgentOperationalPhaseTransitionData {
            newPhase
            oldPhase
            trigger
            toolName
            errorMessage
            errorDetails
          }
          ... on GraphQLErrorEventData {
            source
            message
            details
          }
          ... on GraphQLToolInvocationApprovalRequestedData {
            invocationId
            toolName
            arguments
          }
          ... on GraphQLToolInvocationAutoExecutingData {
            invocationId
            toolName
            arguments
          }
          ... on GraphQLSystemTaskNotificationData {
            senderId
            content
          }
        }
      }
    }
    ... on GraphQLTasksAddedEvent {
      teamId
      tasks {
        taskId
        taskName
        assigneeName
        description
        dependencies
        fileDeliverables {
          filePath
          summary
          authorAgentName
          timestamp
        }
      }
    }
    ... on GraphQLTaskStatusUpdatedEvent {
      teamId
      taskId
      newStatus
      agentName
      deliverables {
        filePath
        summary
        authorAgentName
        timestamp
      }
    }
  }
}
    `;
export const CreateAgentDefinitionDocument = gql`
    mutation CreateAgentDefinition($input: CreateAgentDefinitionInput!) {
  createAgentDefinition(input: $input) {
    __typename
    id
    name
    role
    description
    toolNames
    inputProcessorNames
    llmResponseProcessorNames
    systemPromptProcessorNames
    toolExecutionResultProcessorNames
    phaseHookNames
    systemPromptCategory
    systemPromptName
    prompts {
      __typename
      id
      name
      category
    }
  }
}
    `;

/**
 * __useCreateAgentDefinitionMutation__
 *
 * To run a mutation, you first call `useCreateAgentDefinitionMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useCreateAgentDefinitionMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useCreateAgentDefinitionMutation({
 *   variables: {
 *     input: // value for 'input'
 *   },
 * });
 */
export function useCreateAgentDefinitionMutation(options: VueApolloComposable.UseMutationOptions<CreateAgentDefinitionMutation, CreateAgentDefinitionMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<CreateAgentDefinitionMutation, CreateAgentDefinitionMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<CreateAgentDefinitionMutation, CreateAgentDefinitionMutationVariables>(CreateAgentDefinitionDocument, options);
}
export type CreateAgentDefinitionMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<CreateAgentDefinitionMutation, CreateAgentDefinitionMutationVariables>;
export const UpdateAgentDefinitionDocument = gql`
    mutation UpdateAgentDefinition($input: UpdateAgentDefinitionInput!) {
  updateAgentDefinition(input: $input) {
    __typename
    id
    name
    role
    description
    toolNames
    inputProcessorNames
    llmResponseProcessorNames
    systemPromptProcessorNames
    toolExecutionResultProcessorNames
    phaseHookNames
    systemPromptCategory
    systemPromptName
  }
}
    `;

/**
 * __useUpdateAgentDefinitionMutation__
 *
 * To run a mutation, you first call `useUpdateAgentDefinitionMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useUpdateAgentDefinitionMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useUpdateAgentDefinitionMutation({
 *   variables: {
 *     input: // value for 'input'
 *   },
 * });
 */
export function useUpdateAgentDefinitionMutation(options: VueApolloComposable.UseMutationOptions<UpdateAgentDefinitionMutation, UpdateAgentDefinitionMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<UpdateAgentDefinitionMutation, UpdateAgentDefinitionMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<UpdateAgentDefinitionMutation, UpdateAgentDefinitionMutationVariables>(UpdateAgentDefinitionDocument, options);
}
export type UpdateAgentDefinitionMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<UpdateAgentDefinitionMutation, UpdateAgentDefinitionMutationVariables>;
export const DeleteAgentDefinitionDocument = gql`
    mutation DeleteAgentDefinition($id: String!) {
  deleteAgentDefinition(id: $id) {
    __typename
    success
    message
  }
}
    `;

/**
 * __useDeleteAgentDefinitionMutation__
 *
 * To run a mutation, you first call `useDeleteAgentDefinitionMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useDeleteAgentDefinitionMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useDeleteAgentDefinitionMutation({
 *   variables: {
 *     id: // value for 'id'
 *   },
 * });
 */
export function useDeleteAgentDefinitionMutation(options: VueApolloComposable.UseMutationOptions<DeleteAgentDefinitionMutation, DeleteAgentDefinitionMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<DeleteAgentDefinitionMutation, DeleteAgentDefinitionMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<DeleteAgentDefinitionMutation, DeleteAgentDefinitionMutationVariables>(DeleteAgentDefinitionDocument, options);
}
export type DeleteAgentDefinitionMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<DeleteAgentDefinitionMutation, DeleteAgentDefinitionMutationVariables>;
export const TerminateAgentInstanceDocument = gql`
    mutation TerminateAgentInstance($id: String!) {
  terminateAgentInstance(id: $id) {
    __typename
    success
    message
  }
}
    `;

/**
 * __useTerminateAgentInstanceMutation__
 *
 * To run a mutation, you first call `useTerminateAgentInstanceMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useTerminateAgentInstanceMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useTerminateAgentInstanceMutation({
 *   variables: {
 *     id: // value for 'id'
 *   },
 * });
 */
export function useTerminateAgentInstanceMutation(options: VueApolloComposable.UseMutationOptions<TerminateAgentInstanceMutation, TerminateAgentInstanceMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<TerminateAgentInstanceMutation, TerminateAgentInstanceMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<TerminateAgentInstanceMutation, TerminateAgentInstanceMutationVariables>(TerminateAgentInstanceDocument, options);
}
export type TerminateAgentInstanceMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<TerminateAgentInstanceMutation, TerminateAgentInstanceMutationVariables>;
export const SendAgentUserInputDocument = gql`
    mutation SendAgentUserInput($input: SendAgentUserInputInput!) {
  sendAgentUserInput(input: $input) {
    __typename
    success
    message
    agentId
  }
}
    `;

/**
 * __useSendAgentUserInputMutation__
 *
 * To run a mutation, you first call `useSendAgentUserInputMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useSendAgentUserInputMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useSendAgentUserInputMutation({
 *   variables: {
 *     input: // value for 'input'
 *   },
 * });
 */
export function useSendAgentUserInputMutation(options: VueApolloComposable.UseMutationOptions<SendAgentUserInputMutation, SendAgentUserInputMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<SendAgentUserInputMutation, SendAgentUserInputMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<SendAgentUserInputMutation, SendAgentUserInputMutationVariables>(SendAgentUserInputDocument, options);
}
export type SendAgentUserInputMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<SendAgentUserInputMutation, SendAgentUserInputMutationVariables>;
export const ApproveToolInvocationDocument = gql`
    mutation ApproveToolInvocation($input: ApproveToolInvocationInput!) {
  approveToolInvocation(input: $input) {
    __typename
    success
    message
  }
}
    `;

/**
 * __useApproveToolInvocationMutation__
 *
 * To run a mutation, you first call `useApproveToolInvocationMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useApproveToolInvocationMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useApproveToolInvocationMutation({
 *   variables: {
 *     input: // value for 'input'
 *   },
 * });
 */
export function useApproveToolInvocationMutation(options: VueApolloComposable.UseMutationOptions<ApproveToolInvocationMutation, ApproveToolInvocationMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<ApproveToolInvocationMutation, ApproveToolInvocationMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<ApproveToolInvocationMutation, ApproveToolInvocationMutationVariables>(ApproveToolInvocationDocument, options);
}
export type ApproveToolInvocationMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<ApproveToolInvocationMutation, ApproveToolInvocationMutationVariables>;
export const CreateAgentTeamDefinitionDocument = gql`
    mutation CreateAgentTeamDefinition($input: CreateAgentTeamDefinitionInput!) {
  createAgentTeamDefinition(input: $input) {
    __typename
    id
    name
  }
}
    `;

/**
 * __useCreateAgentTeamDefinitionMutation__
 *
 * To run a mutation, you first call `useCreateAgentTeamDefinitionMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useCreateAgentTeamDefinitionMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useCreateAgentTeamDefinitionMutation({
 *   variables: {
 *     input: // value for 'input'
 *   },
 * });
 */
export function useCreateAgentTeamDefinitionMutation(options: VueApolloComposable.UseMutationOptions<CreateAgentTeamDefinitionMutation, CreateAgentTeamDefinitionMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<CreateAgentTeamDefinitionMutation, CreateAgentTeamDefinitionMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<CreateAgentTeamDefinitionMutation, CreateAgentTeamDefinitionMutationVariables>(CreateAgentTeamDefinitionDocument, options);
}
export type CreateAgentTeamDefinitionMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<CreateAgentTeamDefinitionMutation, CreateAgentTeamDefinitionMutationVariables>;
export const UpdateAgentTeamDefinitionDocument = gql`
    mutation UpdateAgentTeamDefinition($input: UpdateAgentTeamDefinitionInput!) {
  updateAgentTeamDefinition(input: $input) {
    __typename
    id
    name
  }
}
    `;

/**
 * __useUpdateAgentTeamDefinitionMutation__
 *
 * To run a mutation, you first call `useUpdateAgentTeamDefinitionMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useUpdateAgentTeamDefinitionMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useUpdateAgentTeamDefinitionMutation({
 *   variables: {
 *     input: // value for 'input'
 *   },
 * });
 */
export function useUpdateAgentTeamDefinitionMutation(options: VueApolloComposable.UseMutationOptions<UpdateAgentTeamDefinitionMutation, UpdateAgentTeamDefinitionMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<UpdateAgentTeamDefinitionMutation, UpdateAgentTeamDefinitionMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<UpdateAgentTeamDefinitionMutation, UpdateAgentTeamDefinitionMutationVariables>(UpdateAgentTeamDefinitionDocument, options);
}
export type UpdateAgentTeamDefinitionMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<UpdateAgentTeamDefinitionMutation, UpdateAgentTeamDefinitionMutationVariables>;
export const DeleteAgentTeamDefinitionDocument = gql`
    mutation DeleteAgentTeamDefinition($id: String!) {
  deleteAgentTeamDefinition(id: $id) {
    __typename
    success
    message
  }
}
    `;

/**
 * __useDeleteAgentTeamDefinitionMutation__
 *
 * To run a mutation, you first call `useDeleteAgentTeamDefinitionMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useDeleteAgentTeamDefinitionMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useDeleteAgentTeamDefinitionMutation({
 *   variables: {
 *     id: // value for 'id'
 *   },
 * });
 */
export function useDeleteAgentTeamDefinitionMutation(options: VueApolloComposable.UseMutationOptions<DeleteAgentTeamDefinitionMutation, DeleteAgentTeamDefinitionMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<DeleteAgentTeamDefinitionMutation, DeleteAgentTeamDefinitionMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<DeleteAgentTeamDefinitionMutation, DeleteAgentTeamDefinitionMutationVariables>(DeleteAgentTeamDefinitionDocument, options);
}
export type DeleteAgentTeamDefinitionMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<DeleteAgentTeamDefinitionMutation, DeleteAgentTeamDefinitionMutationVariables>;
export const CreateAgentTeamInstanceDocument = gql`
    mutation CreateAgentTeamInstance($input: CreateAgentTeamInstanceInput!) {
  createAgentTeamInstance(input: $input) {
    __typename
    success
    message
    teamId
  }
}
    `;

/**
 * __useCreateAgentTeamInstanceMutation__
 *
 * To run a mutation, you first call `useCreateAgentTeamInstanceMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useCreateAgentTeamInstanceMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useCreateAgentTeamInstanceMutation({
 *   variables: {
 *     input: // value for 'input'
 *   },
 * });
 */
export function useCreateAgentTeamInstanceMutation(options: VueApolloComposable.UseMutationOptions<CreateAgentTeamInstanceMutation, CreateAgentTeamInstanceMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<CreateAgentTeamInstanceMutation, CreateAgentTeamInstanceMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<CreateAgentTeamInstanceMutation, CreateAgentTeamInstanceMutationVariables>(CreateAgentTeamInstanceDocument, options);
}
export type CreateAgentTeamInstanceMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<CreateAgentTeamInstanceMutation, CreateAgentTeamInstanceMutationVariables>;
export const TerminateAgentTeamInstanceDocument = gql`
    mutation TerminateAgentTeamInstance($id: String!) {
  terminateAgentTeamInstance(id: $id) {
    __typename
    success
    message
  }
}
    `;

/**
 * __useTerminateAgentTeamInstanceMutation__
 *
 * To run a mutation, you first call `useTerminateAgentTeamInstanceMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useTerminateAgentTeamInstanceMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useTerminateAgentTeamInstanceMutation({
 *   variables: {
 *     id: // value for 'id'
 *   },
 * });
 */
export function useTerminateAgentTeamInstanceMutation(options: VueApolloComposable.UseMutationOptions<TerminateAgentTeamInstanceMutation, TerminateAgentTeamInstanceMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<TerminateAgentTeamInstanceMutation, TerminateAgentTeamInstanceMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<TerminateAgentTeamInstanceMutation, TerminateAgentTeamInstanceMutationVariables>(TerminateAgentTeamInstanceDocument, options);
}
export type TerminateAgentTeamInstanceMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<TerminateAgentTeamInstanceMutation, TerminateAgentTeamInstanceMutationVariables>;
export const SendMessageToTeamDocument = gql`
    mutation SendMessageToTeam($input: SendMessageToTeamInput!) {
  sendMessageToTeam(input: $input) {
    __typename
    success
    message
    teamId
  }
}
    `;

/**
 * __useSendMessageToTeamMutation__
 *
 * To run a mutation, you first call `useSendMessageToTeamMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useSendMessageToTeamMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useSendMessageToTeamMutation({
 *   variables: {
 *     input: // value for 'input'
 *   },
 * });
 */
export function useSendMessageToTeamMutation(options: VueApolloComposable.UseMutationOptions<SendMessageToTeamMutation, SendMessageToTeamMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<SendMessageToTeamMutation, SendMessageToTeamMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<SendMessageToTeamMutation, SendMessageToTeamMutationVariables>(SendMessageToTeamDocument, options);
}
export type SendMessageToTeamMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<SendMessageToTeamMutation, SendMessageToTeamMutationVariables>;
export const WriteFileContentDocument = gql`
    mutation WriteFileContent($workspaceId: String!, $filePath: String!, $content: String!) {
  writeFileContent(
    workspaceId: $workspaceId
    filePath: $filePath
    content: $content
  )
}
    `;

/**
 * __useWriteFileContentMutation__
 *
 * To run a mutation, you first call `useWriteFileContentMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useWriteFileContentMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useWriteFileContentMutation({
 *   variables: {
 *     workspaceId: // value for 'workspaceId'
 *     filePath: // value for 'filePath'
 *     content: // value for 'content'
 *   },
 * });
 */
export function useWriteFileContentMutation(options: VueApolloComposable.UseMutationOptions<WriteFileContentMutation, WriteFileContentMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<WriteFileContentMutation, WriteFileContentMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<WriteFileContentMutation, WriteFileContentMutationVariables>(WriteFileContentDocument, options);
}
export type WriteFileContentMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<WriteFileContentMutation, WriteFileContentMutationVariables>;
export const DeleteFileOrFolderDocument = gql`
    mutation DeleteFileOrFolder($workspaceId: String!, $path: String!) {
  deleteFileOrFolder(workspaceId: $workspaceId, path: $path)
}
    `;

/**
 * __useDeleteFileOrFolderMutation__
 *
 * To run a mutation, you first call `useDeleteFileOrFolderMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useDeleteFileOrFolderMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useDeleteFileOrFolderMutation({
 *   variables: {
 *     workspaceId: // value for 'workspaceId'
 *     path: // value for 'path'
 *   },
 * });
 */
export function useDeleteFileOrFolderMutation(options: VueApolloComposable.UseMutationOptions<DeleteFileOrFolderMutation, DeleteFileOrFolderMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<DeleteFileOrFolderMutation, DeleteFileOrFolderMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<DeleteFileOrFolderMutation, DeleteFileOrFolderMutationVariables>(DeleteFileOrFolderDocument, options);
}
export type DeleteFileOrFolderMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<DeleteFileOrFolderMutation, DeleteFileOrFolderMutationVariables>;
export const MoveFileOrFolderDocument = gql`
    mutation MoveFileOrFolder($workspaceId: String!, $sourcePath: String!, $destinationPath: String!) {
  moveFileOrFolder(
    workspaceId: $workspaceId
    sourcePath: $sourcePath
    destinationPath: $destinationPath
  )
}
    `;

/**
 * __useMoveFileOrFolderMutation__
 *
 * To run a mutation, you first call `useMoveFileOrFolderMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useMoveFileOrFolderMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useMoveFileOrFolderMutation({
 *   variables: {
 *     workspaceId: // value for 'workspaceId'
 *     sourcePath: // value for 'sourcePath'
 *     destinationPath: // value for 'destinationPath'
 *   },
 * });
 */
export function useMoveFileOrFolderMutation(options: VueApolloComposable.UseMutationOptions<MoveFileOrFolderMutation, MoveFileOrFolderMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<MoveFileOrFolderMutation, MoveFileOrFolderMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<MoveFileOrFolderMutation, MoveFileOrFolderMutationVariables>(MoveFileOrFolderDocument, options);
}
export type MoveFileOrFolderMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<MoveFileOrFolderMutation, MoveFileOrFolderMutationVariables>;
export const RenameFileOrFolderDocument = gql`
    mutation RenameFileOrFolder($workspaceId: String!, $targetPath: String!, $newName: String!) {
  renameFileOrFolder(
    workspaceId: $workspaceId
    targetPath: $targetPath
    newName: $newName
  )
}
    `;

/**
 * __useRenameFileOrFolderMutation__
 *
 * To run a mutation, you first call `useRenameFileOrFolderMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useRenameFileOrFolderMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useRenameFileOrFolderMutation({
 *   variables: {
 *     workspaceId: // value for 'workspaceId'
 *     targetPath: // value for 'targetPath'
 *     newName: // value for 'newName'
 *   },
 * });
 */
export function useRenameFileOrFolderMutation(options: VueApolloComposable.UseMutationOptions<RenameFileOrFolderMutation, RenameFileOrFolderMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<RenameFileOrFolderMutation, RenameFileOrFolderMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<RenameFileOrFolderMutation, RenameFileOrFolderMutationVariables>(RenameFileOrFolderDocument, options);
}
export type RenameFileOrFolderMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<RenameFileOrFolderMutation, RenameFileOrFolderMutationVariables>;
export const CreateFileOrFolderDocument = gql`
    mutation CreateFileOrFolder($workspaceId: String!, $path: String!, $isFile: Boolean!) {
  createFileOrFolder(workspaceId: $workspaceId, path: $path, isFile: $isFile)
}
    `;

/**
 * __useCreateFileOrFolderMutation__
 *
 * To run a mutation, you first call `useCreateFileOrFolderMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useCreateFileOrFolderMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useCreateFileOrFolderMutation({
 *   variables: {
 *     workspaceId: // value for 'workspaceId'
 *     path: // value for 'path'
 *     isFile: // value for 'isFile'
 *   },
 * });
 */
export function useCreateFileOrFolderMutation(options: VueApolloComposable.UseMutationOptions<CreateFileOrFolderMutation, CreateFileOrFolderMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<CreateFileOrFolderMutation, CreateFileOrFolderMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<CreateFileOrFolderMutation, CreateFileOrFolderMutationVariables>(CreateFileOrFolderDocument, options);
}
export type CreateFileOrFolderMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<CreateFileOrFolderMutation, CreateFileOrFolderMutationVariables>;
export const SetLlmProviderApiKeyDocument = gql`
    mutation SetLLMProviderApiKey($provider: String!, $apiKey: String!) {
  setLlmProviderApiKey(provider: $provider, apiKey: $apiKey)
}
    `;

/**
 * __useSetLlmProviderApiKeyMutation__
 *
 * To run a mutation, you first call `useSetLlmProviderApiKeyMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useSetLlmProviderApiKeyMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useSetLlmProviderApiKeyMutation({
 *   variables: {
 *     provider: // value for 'provider'
 *     apiKey: // value for 'apiKey'
 *   },
 * });
 */
export function useSetLlmProviderApiKeyMutation(options: VueApolloComposable.UseMutationOptions<SetLlmProviderApiKeyMutation, SetLlmProviderApiKeyMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<SetLlmProviderApiKeyMutation, SetLlmProviderApiKeyMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<SetLlmProviderApiKeyMutation, SetLlmProviderApiKeyMutationVariables>(SetLlmProviderApiKeyDocument, options);
}
export type SetLlmProviderApiKeyMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<SetLlmProviderApiKeyMutation, SetLlmProviderApiKeyMutationVariables>;
export const ReloadLlmModelsDocument = gql`
    mutation ReloadLLMModels {
  reloadLlmModels
}
    `;

/**
 * __useReloadLlmModelsMutation__
 *
 * To run a mutation, you first call `useReloadLlmModelsMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useReloadLlmModelsMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useReloadLlmModelsMutation();
 */
export function useReloadLlmModelsMutation(options: VueApolloComposable.UseMutationOptions<ReloadLlmModelsMutation, ReloadLlmModelsMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<ReloadLlmModelsMutation, ReloadLlmModelsMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<ReloadLlmModelsMutation, ReloadLlmModelsMutationVariables>(ReloadLlmModelsDocument, options);
}
export type ReloadLlmModelsMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<ReloadLlmModelsMutation, ReloadLlmModelsMutationVariables>;
export const ConfigureMcpServerDocument = gql`
    mutation ConfigureMcpServer($input: McpServerInput!) {
  configureMcpServer(input: $input) {
    savedConfig {
      __typename
      ... on StdioMcpServerConfig {
        serverId
        transportType
        enabled
        toolNamePrefix
        command
        args
        env
        cwd
      }
      ... on StreamableHttpMcpServerConfig {
        serverId
        transportType
        enabled
        toolNamePrefix
        url
        token
        headers
      }
    }
  }
}
    `;

/**
 * __useConfigureMcpServerMutation__
 *
 * To run a mutation, you first call `useConfigureMcpServerMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useConfigureMcpServerMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useConfigureMcpServerMutation({
 *   variables: {
 *     input: // value for 'input'
 *   },
 * });
 */
export function useConfigureMcpServerMutation(options: VueApolloComposable.UseMutationOptions<ConfigureMcpServerMutation, ConfigureMcpServerMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<ConfigureMcpServerMutation, ConfigureMcpServerMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<ConfigureMcpServerMutation, ConfigureMcpServerMutationVariables>(ConfigureMcpServerDocument, options);
}
export type ConfigureMcpServerMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<ConfigureMcpServerMutation, ConfigureMcpServerMutationVariables>;
export const DeleteMcpServerDocument = gql`
    mutation DeleteMcpServer($serverId: String!) {
  deleteMcpServer(serverId: $serverId) {
    __typename
    success
    message
  }
}
    `;

/**
 * __useDeleteMcpServerMutation__
 *
 * To run a mutation, you first call `useDeleteMcpServerMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useDeleteMcpServerMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useDeleteMcpServerMutation({
 *   variables: {
 *     serverId: // value for 'serverId'
 *   },
 * });
 */
export function useDeleteMcpServerMutation(options: VueApolloComposable.UseMutationOptions<DeleteMcpServerMutation, DeleteMcpServerMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<DeleteMcpServerMutation, DeleteMcpServerMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<DeleteMcpServerMutation, DeleteMcpServerMutationVariables>(DeleteMcpServerDocument, options);
}
export type DeleteMcpServerMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<DeleteMcpServerMutation, DeleteMcpServerMutationVariables>;
export const DiscoverAndRegisterMcpServerToolsDocument = gql`
    mutation DiscoverAndRegisterMcpServerTools($serverId: String!) {
  discoverAndRegisterMcpServerTools(serverId: $serverId) {
    __typename
    success
    message
    discoveredTools {
      __typename
      name
      description
      origin
      category
      argumentSchema {
        __typename
        parameters {
          __typename
          name
          paramType
          description
          required
          defaultValue
          enumValues
        }
      }
    }
  }
}
    `;

/**
 * __useDiscoverAndRegisterMcpServerToolsMutation__
 *
 * To run a mutation, you first call `useDiscoverAndRegisterMcpServerToolsMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useDiscoverAndRegisterMcpServerToolsMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useDiscoverAndRegisterMcpServerToolsMutation({
 *   variables: {
 *     serverId: // value for 'serverId'
 *   },
 * });
 */
export function useDiscoverAndRegisterMcpServerToolsMutation(options: VueApolloComposable.UseMutationOptions<DiscoverAndRegisterMcpServerToolsMutation, DiscoverAndRegisterMcpServerToolsMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<DiscoverAndRegisterMcpServerToolsMutation, DiscoverAndRegisterMcpServerToolsMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<DiscoverAndRegisterMcpServerToolsMutation, DiscoverAndRegisterMcpServerToolsMutationVariables>(DiscoverAndRegisterMcpServerToolsDocument, options);
}
export type DiscoverAndRegisterMcpServerToolsMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<DiscoverAndRegisterMcpServerToolsMutation, DiscoverAndRegisterMcpServerToolsMutationVariables>;
export const ImportMcpServerConfigsDocument = gql`
    mutation ImportMcpServerConfigs($jsonString: String!) {
  importMcpServerConfigs(jsonString: $jsonString) {
    __typename
    success
    message
    importedCount
    failedCount
  }
}
    `;

/**
 * __useImportMcpServerConfigsMutation__
 *
 * To run a mutation, you first call `useImportMcpServerConfigsMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useImportMcpServerConfigsMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useImportMcpServerConfigsMutation({
 *   variables: {
 *     jsonString: // value for 'jsonString'
 *   },
 * });
 */
export function useImportMcpServerConfigsMutation(options: VueApolloComposable.UseMutationOptions<ImportMcpServerConfigsMutation, ImportMcpServerConfigsMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<ImportMcpServerConfigsMutation, ImportMcpServerConfigsMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<ImportMcpServerConfigsMutation, ImportMcpServerConfigsMutationVariables>(ImportMcpServerConfigsDocument, options);
}
export type ImportMcpServerConfigsMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<ImportMcpServerConfigsMutation, ImportMcpServerConfigsMutationVariables>;
export const CreatePromptDocument = gql`
    mutation CreatePrompt($input: CreatePromptInput!) {
  createPrompt(input: $input) {
    __typename
    id
    name
    category
    promptContent
    description
    suitableForModels
    version
    createdAt
    parentPromptId
    isActive
    isForAgentTeam
  }
}
    `;

/**
 * __useCreatePromptMutation__
 *
 * To run a mutation, you first call `useCreatePromptMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useCreatePromptMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useCreatePromptMutation({
 *   variables: {
 *     input: // value for 'input'
 *   },
 * });
 */
export function useCreatePromptMutation(options: VueApolloComposable.UseMutationOptions<CreatePromptMutation, CreatePromptMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<CreatePromptMutation, CreatePromptMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<CreatePromptMutation, CreatePromptMutationVariables>(CreatePromptDocument, options);
}
export type CreatePromptMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<CreatePromptMutation, CreatePromptMutationVariables>;
export const UpdatePromptDocument = gql`
    mutation UpdatePrompt($input: UpdatePromptInput!) {
  updatePrompt(input: $input) {
    __typename
    id
    name
    category
    promptContent
    description
    suitableForModels
    version
    createdAt
    updatedAt
    parentPromptId
    isActive
    isForAgentTeam
  }
}
    `;

/**
 * __useUpdatePromptMutation__
 *
 * To run a mutation, you first call `useUpdatePromptMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useUpdatePromptMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useUpdatePromptMutation({
 *   variables: {
 *     input: // value for 'input'
 *   },
 * });
 */
export function useUpdatePromptMutation(options: VueApolloComposable.UseMutationOptions<UpdatePromptMutation, UpdatePromptMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<UpdatePromptMutation, UpdatePromptMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<UpdatePromptMutation, UpdatePromptMutationVariables>(UpdatePromptDocument, options);
}
export type UpdatePromptMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<UpdatePromptMutation, UpdatePromptMutationVariables>;
export const AddNewPromptRevisionDocument = gql`
    mutation AddNewPromptRevision($input: AddNewPromptRevisionInput!) {
  addNewPromptRevision(input: $input) {
    __typename
    id
    name
    category
    promptContent
    description
    suitableForModels
    version
    createdAt
    parentPromptId
    isActive
    isForAgentTeam
  }
}
    `;

/**
 * __useAddNewPromptRevisionMutation__
 *
 * To run a mutation, you first call `useAddNewPromptRevisionMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useAddNewPromptRevisionMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useAddNewPromptRevisionMutation({
 *   variables: {
 *     input: // value for 'input'
 *   },
 * });
 */
export function useAddNewPromptRevisionMutation(options: VueApolloComposable.UseMutationOptions<AddNewPromptRevisionMutation, AddNewPromptRevisionMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<AddNewPromptRevisionMutation, AddNewPromptRevisionMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<AddNewPromptRevisionMutation, AddNewPromptRevisionMutationVariables>(AddNewPromptRevisionDocument, options);
}
export type AddNewPromptRevisionMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<AddNewPromptRevisionMutation, AddNewPromptRevisionMutationVariables>;
export const MarkActivePromptDocument = gql`
    mutation MarkActivePrompt($input: MarkActivePromptInput!) {
  markActivePrompt(input: $input) {
    __typename
    id
    isActive
  }
}
    `;

/**
 * __useMarkActivePromptMutation__
 *
 * To run a mutation, you first call `useMarkActivePromptMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useMarkActivePromptMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useMarkActivePromptMutation({
 *   variables: {
 *     input: // value for 'input'
 *   },
 * });
 */
export function useMarkActivePromptMutation(options: VueApolloComposable.UseMutationOptions<MarkActivePromptMutation, MarkActivePromptMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<MarkActivePromptMutation, MarkActivePromptMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<MarkActivePromptMutation, MarkActivePromptMutationVariables>(MarkActivePromptDocument, options);
}
export type MarkActivePromptMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<MarkActivePromptMutation, MarkActivePromptMutationVariables>;
export const SyncPromptsDocument = gql`
    mutation SyncPrompts {
  syncPrompts {
    __typename
    success
    message
    initialCount
    finalCount
    syncedCount
  }
}
    `;

/**
 * __useSyncPromptsMutation__
 *
 * To run a mutation, you first call `useSyncPromptsMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useSyncPromptsMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useSyncPromptsMutation();
 */
export function useSyncPromptsMutation(options: VueApolloComposable.UseMutationOptions<SyncPromptsMutation, SyncPromptsMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<SyncPromptsMutation, SyncPromptsMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<SyncPromptsMutation, SyncPromptsMutationVariables>(SyncPromptsDocument, options);
}
export type SyncPromptsMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<SyncPromptsMutation, SyncPromptsMutationVariables>;
export const DeletePromptDocument = gql`
    mutation DeletePrompt($input: DeletePromptInput!) {
  deletePrompt(input: $input) {
    __typename
    success
    message
  }
}
    `;

/**
 * __useDeletePromptMutation__
 *
 * To run a mutation, you first call `useDeletePromptMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useDeletePromptMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useDeletePromptMutation({
 *   variables: {
 *     input: // value for 'input'
 *   },
 * });
 */
export function useDeletePromptMutation(options: VueApolloComposable.UseMutationOptions<DeletePromptMutation, DeletePromptMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<DeletePromptMutation, DeletePromptMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<DeletePromptMutation, DeletePromptMutationVariables>(DeletePromptDocument, options);
}
export type DeletePromptMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<DeletePromptMutation, DeletePromptMutationVariables>;
export const UpdateServerSettingDocument = gql`
    mutation UpdateServerSetting($key: String!, $value: String!) {
  updateServerSetting(key: $key, value: $value)
}
    `;

/**
 * __useUpdateServerSettingMutation__
 *
 * To run a mutation, you first call `useUpdateServerSettingMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useUpdateServerSettingMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useUpdateServerSettingMutation({
 *   variables: {
 *     key: // value for 'key'
 *     value: // value for 'value'
 *   },
 * });
 */
export function useUpdateServerSettingMutation(options: VueApolloComposable.UseMutationOptions<UpdateServerSettingMutation, UpdateServerSettingMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<UpdateServerSettingMutation, UpdateServerSettingMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<UpdateServerSettingMutation, UpdateServerSettingMutationVariables>(UpdateServerSettingDocument, options);
}
export type UpdateServerSettingMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<UpdateServerSettingMutation, UpdateServerSettingMutationVariables>;
export const CreateWorkspaceDocument = gql`
    mutation CreateWorkspace($input: CreateWorkspaceInput!) {
  createWorkspace(input: $input) {
    __typename
    workspaceId
    name
    fileExplorer
    absolutePath
  }
}
    `;

/**
 * __useCreateWorkspaceMutation__
 *
 * To run a mutation, you first call `useCreateWorkspaceMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useCreateWorkspaceMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useCreateWorkspaceMutation({
 *   variables: {
 *     input: // value for 'input'
 *   },
 * });
 */
export function useCreateWorkspaceMutation(options: VueApolloComposable.UseMutationOptions<CreateWorkspaceMutation, CreateWorkspaceMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<CreateWorkspaceMutation, CreateWorkspaceMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<CreateWorkspaceMutation, CreateWorkspaceMutationVariables>(CreateWorkspaceDocument, options);
}
export type CreateWorkspaceMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<CreateWorkspaceMutation, CreateWorkspaceMutationVariables>;
export const ExecuteBashCommandsDocument = gql`
    mutation ExecuteBashCommands($workspaceId: String!, $command: String!) {
  executeBashCommands(workspaceId: $workspaceId, command: $command) {
    __typename
    success
    message
  }
}
    `;

/**
 * __useExecuteBashCommandsMutation__
 *
 * To run a mutation, you first call `useExecuteBashCommandsMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useExecuteBashCommandsMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useExecuteBashCommandsMutation({
 *   variables: {
 *     workspaceId: // value for 'workspaceId'
 *     command: // value for 'command'
 *   },
 * });
 */
export function useExecuteBashCommandsMutation(options: VueApolloComposable.UseMutationOptions<ExecuteBashCommandsMutation, ExecuteBashCommandsMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<ExecuteBashCommandsMutation, ExecuteBashCommandsMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<ExecuteBashCommandsMutation, ExecuteBashCommandsMutationVariables>(ExecuteBashCommandsDocument, options);
}
export type ExecuteBashCommandsMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<ExecuteBashCommandsMutation, ExecuteBashCommandsMutationVariables>;
export const GetAgentCustomizationOptionsDocument = gql`
    query GetAgentCustomizationOptions {
  availableToolNames
  availableInputProcessorNames
  availableLlmResponseProcessorNames
  availableSystemPromptProcessorNames
  availableToolExecutionResultProcessorNames
  availablePhaseHookNames
  availablePromptCategories {
    __typename
    category
    names
  }
}
    `;

/**
 * __useGetAgentCustomizationOptionsQuery__
 *
 * To run a query within a Vue component, call `useGetAgentCustomizationOptionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAgentCustomizationOptionsQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useGetAgentCustomizationOptionsQuery();
 */
export function useGetAgentCustomizationOptionsQuery(options: VueApolloComposable.UseQueryOptions<GetAgentCustomizationOptionsQuery, GetAgentCustomizationOptionsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetAgentCustomizationOptionsQuery, GetAgentCustomizationOptionsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetAgentCustomizationOptionsQuery, GetAgentCustomizationOptionsQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<GetAgentCustomizationOptionsQuery, GetAgentCustomizationOptionsQueryVariables>(GetAgentCustomizationOptionsDocument, {}, options);
}
export function useGetAgentCustomizationOptionsLazyQuery(options: VueApolloComposable.UseQueryOptions<GetAgentCustomizationOptionsQuery, GetAgentCustomizationOptionsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetAgentCustomizationOptionsQuery, GetAgentCustomizationOptionsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetAgentCustomizationOptionsQuery, GetAgentCustomizationOptionsQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<GetAgentCustomizationOptionsQuery, GetAgentCustomizationOptionsQueryVariables>(GetAgentCustomizationOptionsDocument, {}, options);
}
export type GetAgentCustomizationOptionsQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<GetAgentCustomizationOptionsQuery, GetAgentCustomizationOptionsQueryVariables>;
export const GetAgentDefinitionsDocument = gql`
    query GetAgentDefinitions {
  agentDefinitions {
    __typename
    id
    name
    role
    description
    toolNames
    inputProcessorNames
    llmResponseProcessorNames
    systemPromptProcessorNames
    toolExecutionResultProcessorNames
    phaseHookNames
    systemPromptCategory
    systemPromptName
    prompts {
      __typename
      id
      name
      category
      promptContent
      description
      suitableForModels
      version
      createdAt
      updatedAt
      parentPromptId
      isActive
      isForAgentTeam
    }
  }
}
    `;

/**
 * __useGetAgentDefinitionsQuery__
 *
 * To run a query within a Vue component, call `useGetAgentDefinitionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAgentDefinitionsQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useGetAgentDefinitionsQuery();
 */
export function useGetAgentDefinitionsQuery(options: VueApolloComposable.UseQueryOptions<GetAgentDefinitionsQuery, GetAgentDefinitionsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetAgentDefinitionsQuery, GetAgentDefinitionsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetAgentDefinitionsQuery, GetAgentDefinitionsQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<GetAgentDefinitionsQuery, GetAgentDefinitionsQueryVariables>(GetAgentDefinitionsDocument, {}, options);
}
export function useGetAgentDefinitionsLazyQuery(options: VueApolloComposable.UseQueryOptions<GetAgentDefinitionsQuery, GetAgentDefinitionsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetAgentDefinitionsQuery, GetAgentDefinitionsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetAgentDefinitionsQuery, GetAgentDefinitionsQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<GetAgentDefinitionsQuery, GetAgentDefinitionsQueryVariables>(GetAgentDefinitionsDocument, {}, options);
}
export type GetAgentDefinitionsQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<GetAgentDefinitionsQuery, GetAgentDefinitionsQueryVariables>;
export const GetAgentInstancesDocument = gql`
    query GetAgentInstances {
  agentInstances {
    __typename
    id
    name
    role
    currentPhase
    agentDefinitionId
    workspace {
      __typename
      workspaceId
      name
      workspaceTypeName
      config
    }
  }
}
    `;

/**
 * __useGetAgentInstancesQuery__
 *
 * To run a query within a Vue component, call `useGetAgentInstancesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAgentInstancesQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useGetAgentInstancesQuery();
 */
export function useGetAgentInstancesQuery(options: VueApolloComposable.UseQueryOptions<GetAgentInstancesQuery, GetAgentInstancesQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetAgentInstancesQuery, GetAgentInstancesQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetAgentInstancesQuery, GetAgentInstancesQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<GetAgentInstancesQuery, GetAgentInstancesQueryVariables>(GetAgentInstancesDocument, {}, options);
}
export function useGetAgentInstancesLazyQuery(options: VueApolloComposable.UseQueryOptions<GetAgentInstancesQuery, GetAgentInstancesQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetAgentInstancesQuery, GetAgentInstancesQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetAgentInstancesQuery, GetAgentInstancesQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<GetAgentInstancesQuery, GetAgentInstancesQueryVariables>(GetAgentInstancesDocument, {}, options);
}
export type GetAgentInstancesQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<GetAgentInstancesQuery, GetAgentInstancesQueryVariables>;
export const GetAgentTeamDefinitionsDocument = gql`
    query GetAgentTeamDefinitions {
  agentTeamDefinitions {
    __typename
    id
    name
    description
    role
    coordinatorMemberName
    nodes {
      __typename
      memberName
      referenceId
      referenceType
      dependencies
    }
  }
}
    `;

/**
 * __useGetAgentTeamDefinitionsQuery__
 *
 * To run a query within a Vue component, call `useGetAgentTeamDefinitionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAgentTeamDefinitionsQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useGetAgentTeamDefinitionsQuery();
 */
export function useGetAgentTeamDefinitionsQuery(options: VueApolloComposable.UseQueryOptions<GetAgentTeamDefinitionsQuery, GetAgentTeamDefinitionsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetAgentTeamDefinitionsQuery, GetAgentTeamDefinitionsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetAgentTeamDefinitionsQuery, GetAgentTeamDefinitionsQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<GetAgentTeamDefinitionsQuery, GetAgentTeamDefinitionsQueryVariables>(GetAgentTeamDefinitionsDocument, {}, options);
}
export function useGetAgentTeamDefinitionsLazyQuery(options: VueApolloComposable.UseQueryOptions<GetAgentTeamDefinitionsQuery, GetAgentTeamDefinitionsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetAgentTeamDefinitionsQuery, GetAgentTeamDefinitionsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetAgentTeamDefinitionsQuery, GetAgentTeamDefinitionsQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<GetAgentTeamDefinitionsQuery, GetAgentTeamDefinitionsQueryVariables>(GetAgentTeamDefinitionsDocument, {}, options);
}
export type GetAgentTeamDefinitionsQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<GetAgentTeamDefinitionsQuery, GetAgentTeamDefinitionsQueryVariables>;
export const GetConversationHistoryDocument = gql`
    query GetConversationHistory($agentDefinitionId: String!, $page: Int, $pageSize: Int, $searchQuery: String) {
  getConversationHistory(
    agentDefinitionId: $agentDefinitionId
    page: $page
    pageSize: $pageSize
    searchQuery: $searchQuery
  ) {
    __typename
    conversations {
      __typename
      agentId
      agentDefinitionId
      createdAt
      llmModel
      useXmlToolFormat
      messages {
        __typename
        messageId
        role
        message
        timestamp
        contextPaths
        originalMessage
        tokenCount
        cost
        reasoning
        imageUrls
        audioUrls
        videoUrls
      }
    }
    totalPages
    currentPage
  }
}
    `;

/**
 * __useGetConversationHistoryQuery__
 *
 * To run a query within a Vue component, call `useGetConversationHistoryQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetConversationHistoryQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the query
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useGetConversationHistoryQuery({
 *   agentDefinitionId: // value for 'agentDefinitionId'
 *   page: // value for 'page'
 *   pageSize: // value for 'pageSize'
 *   searchQuery: // value for 'searchQuery'
 * });
 */
export function useGetConversationHistoryQuery(variables: GetConversationHistoryQueryVariables | VueCompositionApi.Ref<GetConversationHistoryQueryVariables> | ReactiveFunction<GetConversationHistoryQueryVariables>, options: VueApolloComposable.UseQueryOptions<GetConversationHistoryQuery, GetConversationHistoryQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetConversationHistoryQuery, GetConversationHistoryQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetConversationHistoryQuery, GetConversationHistoryQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<GetConversationHistoryQuery, GetConversationHistoryQueryVariables>(GetConversationHistoryDocument, variables, options);
}
export function useGetConversationHistoryLazyQuery(variables?: GetConversationHistoryQueryVariables | VueCompositionApi.Ref<GetConversationHistoryQueryVariables> | ReactiveFunction<GetConversationHistoryQueryVariables>, options: VueApolloComposable.UseQueryOptions<GetConversationHistoryQuery, GetConversationHistoryQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetConversationHistoryQuery, GetConversationHistoryQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetConversationHistoryQuery, GetConversationHistoryQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<GetConversationHistoryQuery, GetConversationHistoryQueryVariables>(GetConversationHistoryDocument, variables, options);
}
export type GetConversationHistoryQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<GetConversationHistoryQuery, GetConversationHistoryQueryVariables>;
export const GetFileContentDocument = gql`
    query GetFileContent($workspaceId: String!, $filePath: String!) {
  fileContent(workspaceId: $workspaceId, filePath: $filePath)
}
    `;

/**
 * __useGetFileContentQuery__
 *
 * To run a query within a Vue component, call `useGetFileContentQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetFileContentQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the query
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useGetFileContentQuery({
 *   workspaceId: // value for 'workspaceId'
 *   filePath: // value for 'filePath'
 * });
 */
export function useGetFileContentQuery(variables: GetFileContentQueryVariables | VueCompositionApi.Ref<GetFileContentQueryVariables> | ReactiveFunction<GetFileContentQueryVariables>, options: VueApolloComposable.UseQueryOptions<GetFileContentQuery, GetFileContentQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetFileContentQuery, GetFileContentQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetFileContentQuery, GetFileContentQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<GetFileContentQuery, GetFileContentQueryVariables>(GetFileContentDocument, variables, options);
}
export function useGetFileContentLazyQuery(variables?: GetFileContentQueryVariables | VueCompositionApi.Ref<GetFileContentQueryVariables> | ReactiveFunction<GetFileContentQueryVariables>, options: VueApolloComposable.UseQueryOptions<GetFileContentQuery, GetFileContentQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetFileContentQuery, GetFileContentQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetFileContentQuery, GetFileContentQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<GetFileContentQuery, GetFileContentQueryVariables>(GetFileContentDocument, variables, options);
}
export type GetFileContentQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<GetFileContentQuery, GetFileContentQueryVariables>;
export const SearchFilesDocument = gql`
    query SearchFiles($workspaceId: String!, $query: String!) {
  searchFiles(workspaceId: $workspaceId, query: $query)
}
    `;

/**
 * __useSearchFilesQuery__
 *
 * To run a query within a Vue component, call `useSearchFilesQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchFilesQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the query
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useSearchFilesQuery({
 *   workspaceId: // value for 'workspaceId'
 *   query: // value for 'query'
 * });
 */
export function useSearchFilesQuery(variables: SearchFilesQueryVariables | VueCompositionApi.Ref<SearchFilesQueryVariables> | ReactiveFunction<SearchFilesQueryVariables>, options: VueApolloComposable.UseQueryOptions<SearchFilesQuery, SearchFilesQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<SearchFilesQuery, SearchFilesQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<SearchFilesQuery, SearchFilesQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<SearchFilesQuery, SearchFilesQueryVariables>(SearchFilesDocument, variables, options);
}
export function useSearchFilesLazyQuery(variables?: SearchFilesQueryVariables | VueCompositionApi.Ref<SearchFilesQueryVariables> | ReactiveFunction<SearchFilesQueryVariables>, options: VueApolloComposable.UseQueryOptions<SearchFilesQuery, SearchFilesQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<SearchFilesQuery, SearchFilesQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<SearchFilesQuery, SearchFilesQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<SearchFilesQuery, SearchFilesQueryVariables>(SearchFilesDocument, variables, options);
}
export type SearchFilesQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<SearchFilesQuery, SearchFilesQueryVariables>;
export const GetLlmProviderApiKeyDocument = gql`
    query GetLLMProviderApiKey($provider: String!) {
  getLlmProviderApiKey(provider: $provider)
}
    `;

/**
 * __useGetLlmProviderApiKeyQuery__
 *
 * To run a query within a Vue component, call `useGetLlmProviderApiKeyQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetLlmProviderApiKeyQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the query
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useGetLlmProviderApiKeyQuery({
 *   provider: // value for 'provider'
 * });
 */
export function useGetLlmProviderApiKeyQuery(variables: GetLlmProviderApiKeyQueryVariables | VueCompositionApi.Ref<GetLlmProviderApiKeyQueryVariables> | ReactiveFunction<GetLlmProviderApiKeyQueryVariables>, options: VueApolloComposable.UseQueryOptions<GetLlmProviderApiKeyQuery, GetLlmProviderApiKeyQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetLlmProviderApiKeyQuery, GetLlmProviderApiKeyQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetLlmProviderApiKeyQuery, GetLlmProviderApiKeyQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<GetLlmProviderApiKeyQuery, GetLlmProviderApiKeyQueryVariables>(GetLlmProviderApiKeyDocument, variables, options);
}
export function useGetLlmProviderApiKeyLazyQuery(variables?: GetLlmProviderApiKeyQueryVariables | VueCompositionApi.Ref<GetLlmProviderApiKeyQueryVariables> | ReactiveFunction<GetLlmProviderApiKeyQueryVariables>, options: VueApolloComposable.UseQueryOptions<GetLlmProviderApiKeyQuery, GetLlmProviderApiKeyQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetLlmProviderApiKeyQuery, GetLlmProviderApiKeyQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetLlmProviderApiKeyQuery, GetLlmProviderApiKeyQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<GetLlmProviderApiKeyQuery, GetLlmProviderApiKeyQueryVariables>(GetLlmProviderApiKeyDocument, variables, options);
}
export type GetLlmProviderApiKeyQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<GetLlmProviderApiKeyQuery, GetLlmProviderApiKeyQueryVariables>;
export const GetAvailableLlmProvidersWithModelsDocument = gql`
    query GetAvailableLLMProvidersWithModels {
  availableLlmProvidersWithModels {
    __typename
    provider
    models {
      __typename
      modelIdentifier
      name
      value
      canonicalName
    }
  }
}
    `;

/**
 * __useGetAvailableLlmProvidersWithModelsQuery__
 *
 * To run a query within a Vue component, call `useGetAvailableLlmProvidersWithModelsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAvailableLlmProvidersWithModelsQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useGetAvailableLlmProvidersWithModelsQuery();
 */
export function useGetAvailableLlmProvidersWithModelsQuery(options: VueApolloComposable.UseQueryOptions<GetAvailableLlmProvidersWithModelsQuery, GetAvailableLlmProvidersWithModelsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetAvailableLlmProvidersWithModelsQuery, GetAvailableLlmProvidersWithModelsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetAvailableLlmProvidersWithModelsQuery, GetAvailableLlmProvidersWithModelsQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<GetAvailableLlmProvidersWithModelsQuery, GetAvailableLlmProvidersWithModelsQueryVariables>(GetAvailableLlmProvidersWithModelsDocument, {}, options);
}
export function useGetAvailableLlmProvidersWithModelsLazyQuery(options: VueApolloComposable.UseQueryOptions<GetAvailableLlmProvidersWithModelsQuery, GetAvailableLlmProvidersWithModelsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetAvailableLlmProvidersWithModelsQuery, GetAvailableLlmProvidersWithModelsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetAvailableLlmProvidersWithModelsQuery, GetAvailableLlmProvidersWithModelsQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<GetAvailableLlmProvidersWithModelsQuery, GetAvailableLlmProvidersWithModelsQueryVariables>(GetAvailableLlmProvidersWithModelsDocument, {}, options);
}
export type GetAvailableLlmProvidersWithModelsQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<GetAvailableLlmProvidersWithModelsQuery, GetAvailableLlmProvidersWithModelsQueryVariables>;
export const GetMcpServersDocument = gql`
    query GetMcpServers {
  mcpServers {
    __typename
    ... on StdioMcpServerConfig {
      serverId
      transportType
      enabled
      toolNamePrefix
      command
      args
      env
      cwd
    }
    ... on StreamableHttpMcpServerConfig {
      serverId
      transportType
      enabled
      toolNamePrefix
      url
      token
      headers
    }
  }
}
    `;

/**
 * __useGetMcpServersQuery__
 *
 * To run a query within a Vue component, call `useGetMcpServersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMcpServersQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useGetMcpServersQuery();
 */
export function useGetMcpServersQuery(options: VueApolloComposable.UseQueryOptions<GetMcpServersQuery, GetMcpServersQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetMcpServersQuery, GetMcpServersQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetMcpServersQuery, GetMcpServersQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<GetMcpServersQuery, GetMcpServersQueryVariables>(GetMcpServersDocument, {}, options);
}
export function useGetMcpServersLazyQuery(options: VueApolloComposable.UseQueryOptions<GetMcpServersQuery, GetMcpServersQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetMcpServersQuery, GetMcpServersQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetMcpServersQuery, GetMcpServersQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<GetMcpServersQuery, GetMcpServersQueryVariables>(GetMcpServersDocument, {}, options);
}
export type GetMcpServersQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<GetMcpServersQuery, GetMcpServersQueryVariables>;
export const PreviewMcpServerToolsDocument = gql`
    query PreviewMcpServerTools($input: McpServerInput!) {
  previewMcpServerTools(input: $input) {
    __typename
    name
    description
  }
}
    `;

/**
 * __usePreviewMcpServerToolsQuery__
 *
 * To run a query within a Vue component, call `usePreviewMcpServerToolsQuery` and pass it any options that fit your needs.
 * When your component renders, `usePreviewMcpServerToolsQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the query
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = usePreviewMcpServerToolsQuery({
 *   input: // value for 'input'
 * });
 */
export function usePreviewMcpServerToolsQuery(variables: PreviewMcpServerToolsQueryVariables | VueCompositionApi.Ref<PreviewMcpServerToolsQueryVariables> | ReactiveFunction<PreviewMcpServerToolsQueryVariables>, options: VueApolloComposable.UseQueryOptions<PreviewMcpServerToolsQuery, PreviewMcpServerToolsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<PreviewMcpServerToolsQuery, PreviewMcpServerToolsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<PreviewMcpServerToolsQuery, PreviewMcpServerToolsQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<PreviewMcpServerToolsQuery, PreviewMcpServerToolsQueryVariables>(PreviewMcpServerToolsDocument, variables, options);
}
export function usePreviewMcpServerToolsLazyQuery(variables?: PreviewMcpServerToolsQueryVariables | VueCompositionApi.Ref<PreviewMcpServerToolsQueryVariables> | ReactiveFunction<PreviewMcpServerToolsQueryVariables>, options: VueApolloComposable.UseQueryOptions<PreviewMcpServerToolsQuery, PreviewMcpServerToolsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<PreviewMcpServerToolsQuery, PreviewMcpServerToolsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<PreviewMcpServerToolsQuery, PreviewMcpServerToolsQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<PreviewMcpServerToolsQuery, PreviewMcpServerToolsQueryVariables>(PreviewMcpServerToolsDocument, variables, options);
}
export type PreviewMcpServerToolsQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<PreviewMcpServerToolsQuery, PreviewMcpServerToolsQueryVariables>;
export const GetPromptsDocument = gql`
    query GetPrompts($isActive: Boolean) {
  prompts(isActive: $isActive) {
    __typename
    id
    name
    category
    promptContent
    description
    suitableForModels
    version
    createdAt
    updatedAt
    parentPromptId
    isActive
    isForAgentTeam
  }
}
    `;

/**
 * __useGetPromptsQuery__
 *
 * To run a query within a Vue component, call `useGetPromptsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPromptsQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the query
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useGetPromptsQuery({
 *   isActive: // value for 'isActive'
 * });
 */
export function useGetPromptsQuery(variables: GetPromptsQueryVariables | VueCompositionApi.Ref<GetPromptsQueryVariables> | ReactiveFunction<GetPromptsQueryVariables> = {}, options: VueApolloComposable.UseQueryOptions<GetPromptsQuery, GetPromptsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetPromptsQuery, GetPromptsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetPromptsQuery, GetPromptsQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<GetPromptsQuery, GetPromptsQueryVariables>(GetPromptsDocument, variables, options);
}
export function useGetPromptsLazyQuery(variables: GetPromptsQueryVariables | VueCompositionApi.Ref<GetPromptsQueryVariables> | ReactiveFunction<GetPromptsQueryVariables> = {}, options: VueApolloComposable.UseQueryOptions<GetPromptsQuery, GetPromptsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetPromptsQuery, GetPromptsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetPromptsQuery, GetPromptsQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<GetPromptsQuery, GetPromptsQueryVariables>(GetPromptsDocument, variables, options);
}
export type GetPromptsQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<GetPromptsQuery, GetPromptsQueryVariables>;
export const GetPromptByIdDocument = gql`
    query GetPromptById($id: String!) {
  promptDetails(id: $id) {
    __typename
    id
    name
    category
    promptContent
    description
    suitableForModels
    version
    createdAt
    updatedAt
    parentPromptId
    isActive
    isForAgentTeam
  }
}
    `;

/**
 * __useGetPromptByIdQuery__
 *
 * To run a query within a Vue component, call `useGetPromptByIdQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPromptByIdQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the query
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useGetPromptByIdQuery({
 *   id: // value for 'id'
 * });
 */
export function useGetPromptByIdQuery(variables: GetPromptByIdQueryVariables | VueCompositionApi.Ref<GetPromptByIdQueryVariables> | ReactiveFunction<GetPromptByIdQueryVariables>, options: VueApolloComposable.UseQueryOptions<GetPromptByIdQuery, GetPromptByIdQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetPromptByIdQuery, GetPromptByIdQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetPromptByIdQuery, GetPromptByIdQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<GetPromptByIdQuery, GetPromptByIdQueryVariables>(GetPromptByIdDocument, variables, options);
}
export function useGetPromptByIdLazyQuery(variables?: GetPromptByIdQueryVariables | VueCompositionApi.Ref<GetPromptByIdQueryVariables> | ReactiveFunction<GetPromptByIdQueryVariables>, options: VueApolloComposable.UseQueryOptions<GetPromptByIdQuery, GetPromptByIdQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetPromptByIdQuery, GetPromptByIdQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetPromptByIdQuery, GetPromptByIdQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<GetPromptByIdQuery, GetPromptByIdQueryVariables>(GetPromptByIdDocument, variables, options);
}
export type GetPromptByIdQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<GetPromptByIdQuery, GetPromptByIdQueryVariables>;
export const GetPromptDetailsByNameAndCategoryDocument = gql`
    query GetPromptDetailsByNameAndCategory($category: String!, $name: String!) {
  promptDetailsByNameAndCategory(category: $category, name: $name) {
    __typename
    description
    promptContent
  }
}
    `;

/**
 * __useGetPromptDetailsByNameAndCategoryQuery__
 *
 * To run a query within a Vue component, call `useGetPromptDetailsByNameAndCategoryQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPromptDetailsByNameAndCategoryQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the query
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useGetPromptDetailsByNameAndCategoryQuery({
 *   category: // value for 'category'
 *   name: // value for 'name'
 * });
 */
export function useGetPromptDetailsByNameAndCategoryQuery(variables: GetPromptDetailsByNameAndCategoryQueryVariables | VueCompositionApi.Ref<GetPromptDetailsByNameAndCategoryQueryVariables> | ReactiveFunction<GetPromptDetailsByNameAndCategoryQueryVariables>, options: VueApolloComposable.UseQueryOptions<GetPromptDetailsByNameAndCategoryQuery, GetPromptDetailsByNameAndCategoryQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetPromptDetailsByNameAndCategoryQuery, GetPromptDetailsByNameAndCategoryQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetPromptDetailsByNameAndCategoryQuery, GetPromptDetailsByNameAndCategoryQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<GetPromptDetailsByNameAndCategoryQuery, GetPromptDetailsByNameAndCategoryQueryVariables>(GetPromptDetailsByNameAndCategoryDocument, variables, options);
}
export function useGetPromptDetailsByNameAndCategoryLazyQuery(variables?: GetPromptDetailsByNameAndCategoryQueryVariables | VueCompositionApi.Ref<GetPromptDetailsByNameAndCategoryQueryVariables> | ReactiveFunction<GetPromptDetailsByNameAndCategoryQueryVariables>, options: VueApolloComposable.UseQueryOptions<GetPromptDetailsByNameAndCategoryQuery, GetPromptDetailsByNameAndCategoryQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetPromptDetailsByNameAndCategoryQuery, GetPromptDetailsByNameAndCategoryQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetPromptDetailsByNameAndCategoryQuery, GetPromptDetailsByNameAndCategoryQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<GetPromptDetailsByNameAndCategoryQuery, GetPromptDetailsByNameAndCategoryQueryVariables>(GetPromptDetailsByNameAndCategoryDocument, variables, options);
}
export type GetPromptDetailsByNameAndCategoryQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<GetPromptDetailsByNameAndCategoryQuery, GetPromptDetailsByNameAndCategoryQueryVariables>;
export const GetServerSettingsDocument = gql`
    query GetServerSettings {
  getServerSettings {
    __typename
    key
    value
    description
  }
}
    `;

/**
 * __useGetServerSettingsQuery__
 *
 * To run a query within a Vue component, call `useGetServerSettingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetServerSettingsQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useGetServerSettingsQuery();
 */
export function useGetServerSettingsQuery(options: VueApolloComposable.UseQueryOptions<GetServerSettingsQuery, GetServerSettingsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetServerSettingsQuery, GetServerSettingsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetServerSettingsQuery, GetServerSettingsQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<GetServerSettingsQuery, GetServerSettingsQueryVariables>(GetServerSettingsDocument, {}, options);
}
export function useGetServerSettingsLazyQuery(options: VueApolloComposable.UseQueryOptions<GetServerSettingsQuery, GetServerSettingsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetServerSettingsQuery, GetServerSettingsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetServerSettingsQuery, GetServerSettingsQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<GetServerSettingsQuery, GetServerSettingsQueryVariables>(GetServerSettingsDocument, {}, options);
}
export type GetServerSettingsQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<GetServerSettingsQuery, GetServerSettingsQueryVariables>;
export const GetUsageStatisticsInPeriodDocument = gql`
    query GetUsageStatisticsInPeriod($startTime: DateTime!, $endTime: DateTime!) {
  usageStatisticsInPeriod(startTime: $startTime, endTime: $endTime) {
    llmModel
    promptTokens
    assistantTokens
    promptCost
    assistantCost
    totalCost
  }
}
    `;

/**
 * __useGetUsageStatisticsInPeriodQuery__
 *
 * To run a query within a Vue component, call `useGetUsageStatisticsInPeriodQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUsageStatisticsInPeriodQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the query
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useGetUsageStatisticsInPeriodQuery({
 *   startTime: // value for 'startTime'
 *   endTime: // value for 'endTime'
 * });
 */
export function useGetUsageStatisticsInPeriodQuery(variables: GetUsageStatisticsInPeriodQueryVariables | VueCompositionApi.Ref<GetUsageStatisticsInPeriodQueryVariables> | ReactiveFunction<GetUsageStatisticsInPeriodQueryVariables>, options: VueApolloComposable.UseQueryOptions<GetUsageStatisticsInPeriodQuery, GetUsageStatisticsInPeriodQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetUsageStatisticsInPeriodQuery, GetUsageStatisticsInPeriodQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetUsageStatisticsInPeriodQuery, GetUsageStatisticsInPeriodQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<GetUsageStatisticsInPeriodQuery, GetUsageStatisticsInPeriodQueryVariables>(GetUsageStatisticsInPeriodDocument, variables, options);
}
export function useGetUsageStatisticsInPeriodLazyQuery(variables?: GetUsageStatisticsInPeriodQueryVariables | VueCompositionApi.Ref<GetUsageStatisticsInPeriodQueryVariables> | ReactiveFunction<GetUsageStatisticsInPeriodQueryVariables>, options: VueApolloComposable.UseQueryOptions<GetUsageStatisticsInPeriodQuery, GetUsageStatisticsInPeriodQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetUsageStatisticsInPeriodQuery, GetUsageStatisticsInPeriodQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetUsageStatisticsInPeriodQuery, GetUsageStatisticsInPeriodQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<GetUsageStatisticsInPeriodQuery, GetUsageStatisticsInPeriodQueryVariables>(GetUsageStatisticsInPeriodDocument, variables, options);
}
export type GetUsageStatisticsInPeriodQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<GetUsageStatisticsInPeriodQuery, GetUsageStatisticsInPeriodQueryVariables>;
export const GetToolsDocument = gql`
    query GetTools($origin: ToolOriginEnum, $sourceServerId: String) {
  tools(origin: $origin, sourceServerId: $sourceServerId) {
    __typename
    name
    description
    origin
    category
    argumentSchema {
      __typename
      parameters {
        __typename
        name
        paramType
        description
        required
        defaultValue
        enumValues
      }
    }
  }
}
    `;

/**
 * __useGetToolsQuery__
 *
 * To run a query within a Vue component, call `useGetToolsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetToolsQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the query
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useGetToolsQuery({
 *   origin: // value for 'origin'
 *   sourceServerId: // value for 'sourceServerId'
 * });
 */
export function useGetToolsQuery(variables: GetToolsQueryVariables | VueCompositionApi.Ref<GetToolsQueryVariables> | ReactiveFunction<GetToolsQueryVariables> = {}, options: VueApolloComposable.UseQueryOptions<GetToolsQuery, GetToolsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetToolsQuery, GetToolsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetToolsQuery, GetToolsQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<GetToolsQuery, GetToolsQueryVariables>(GetToolsDocument, variables, options);
}
export function useGetToolsLazyQuery(variables: GetToolsQueryVariables | VueCompositionApi.Ref<GetToolsQueryVariables> | ReactiveFunction<GetToolsQueryVariables> = {}, options: VueApolloComposable.UseQueryOptions<GetToolsQuery, GetToolsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetToolsQuery, GetToolsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetToolsQuery, GetToolsQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<GetToolsQuery, GetToolsQueryVariables>(GetToolsDocument, variables, options);
}
export type GetToolsQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<GetToolsQuery, GetToolsQueryVariables>;
export const GetToolsGroupedByCategoryDocument = gql`
    query GetToolsGroupedByCategory($origin: ToolOriginEnum!) {
  toolsGroupedByCategory(origin: $origin) {
    __typename
    categoryName
    tools {
      __typename
      name
      description
      origin
      category
      argumentSchema {
        __typename
        parameters {
          __typename
          name
          paramType
          description
          required
          defaultValue
          enumValues
        }
      }
    }
  }
}
    `;

/**
 * __useGetToolsGroupedByCategoryQuery__
 *
 * To run a query within a Vue component, call `useGetToolsGroupedByCategoryQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetToolsGroupedByCategoryQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the query
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useGetToolsGroupedByCategoryQuery({
 *   origin: // value for 'origin'
 * });
 */
export function useGetToolsGroupedByCategoryQuery(variables: GetToolsGroupedByCategoryQueryVariables | VueCompositionApi.Ref<GetToolsGroupedByCategoryQueryVariables> | ReactiveFunction<GetToolsGroupedByCategoryQueryVariables>, options: VueApolloComposable.UseQueryOptions<GetToolsGroupedByCategoryQuery, GetToolsGroupedByCategoryQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetToolsGroupedByCategoryQuery, GetToolsGroupedByCategoryQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetToolsGroupedByCategoryQuery, GetToolsGroupedByCategoryQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<GetToolsGroupedByCategoryQuery, GetToolsGroupedByCategoryQueryVariables>(GetToolsGroupedByCategoryDocument, variables, options);
}
export function useGetToolsGroupedByCategoryLazyQuery(variables?: GetToolsGroupedByCategoryQueryVariables | VueCompositionApi.Ref<GetToolsGroupedByCategoryQueryVariables> | ReactiveFunction<GetToolsGroupedByCategoryQueryVariables>, options: VueApolloComposable.UseQueryOptions<GetToolsGroupedByCategoryQuery, GetToolsGroupedByCategoryQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetToolsGroupedByCategoryQuery, GetToolsGroupedByCategoryQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetToolsGroupedByCategoryQuery, GetToolsGroupedByCategoryQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<GetToolsGroupedByCategoryQuery, GetToolsGroupedByCategoryQueryVariables>(GetToolsGroupedByCategoryDocument, variables, options);
}
export type GetToolsGroupedByCategoryQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<GetToolsGroupedByCategoryQuery, GetToolsGroupedByCategoryQueryVariables>;
export const GetAvailableWorkspaceDefinitionsDocument = gql`
    query GetAvailableWorkspaceDefinitions {
  availableWorkspaceDefinitions {
    __typename
    workspaceTypeName
    description
    configSchema {
      __typename
      name
      type
      description
      required
      defaultValue
    }
  }
}
    `;

/**
 * __useGetAvailableWorkspaceDefinitionsQuery__
 *
 * To run a query within a Vue component, call `useGetAvailableWorkspaceDefinitionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAvailableWorkspaceDefinitionsQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useGetAvailableWorkspaceDefinitionsQuery();
 */
export function useGetAvailableWorkspaceDefinitionsQuery(options: VueApolloComposable.UseQueryOptions<GetAvailableWorkspaceDefinitionsQuery, GetAvailableWorkspaceDefinitionsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetAvailableWorkspaceDefinitionsQuery, GetAvailableWorkspaceDefinitionsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetAvailableWorkspaceDefinitionsQuery, GetAvailableWorkspaceDefinitionsQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<GetAvailableWorkspaceDefinitionsQuery, GetAvailableWorkspaceDefinitionsQueryVariables>(GetAvailableWorkspaceDefinitionsDocument, {}, options);
}
export function useGetAvailableWorkspaceDefinitionsLazyQuery(options: VueApolloComposable.UseQueryOptions<GetAvailableWorkspaceDefinitionsQuery, GetAvailableWorkspaceDefinitionsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetAvailableWorkspaceDefinitionsQuery, GetAvailableWorkspaceDefinitionsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetAvailableWorkspaceDefinitionsQuery, GetAvailableWorkspaceDefinitionsQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<GetAvailableWorkspaceDefinitionsQuery, GetAvailableWorkspaceDefinitionsQueryVariables>(GetAvailableWorkspaceDefinitionsDocument, {}, options);
}
export type GetAvailableWorkspaceDefinitionsQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<GetAvailableWorkspaceDefinitionsQuery, GetAvailableWorkspaceDefinitionsQueryVariables>;
export const GetAllWorkspacesDocument = gql`
    query GetAllWorkspaces {
  workspaces {
    __typename
    workspaceId
    name
    workspaceTypeName
    config
    fileExplorer
    absolutePath
  }
}
    `;

/**
 * __useGetAllWorkspacesQuery__
 *
 * To run a query within a Vue component, call `useGetAllWorkspacesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAllWorkspacesQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useGetAllWorkspacesQuery();
 */
export function useGetAllWorkspacesQuery(options: VueApolloComposable.UseQueryOptions<GetAllWorkspacesQuery, GetAllWorkspacesQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetAllWorkspacesQuery, GetAllWorkspacesQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetAllWorkspacesQuery, GetAllWorkspacesQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<GetAllWorkspacesQuery, GetAllWorkspacesQueryVariables>(GetAllWorkspacesDocument, {}, options);
}
export function useGetAllWorkspacesLazyQuery(options: VueApolloComposable.UseQueryOptions<GetAllWorkspacesQuery, GetAllWorkspacesQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetAllWorkspacesQuery, GetAllWorkspacesQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetAllWorkspacesQuery, GetAllWorkspacesQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<GetAllWorkspacesQuery, GetAllWorkspacesQueryVariables>(GetAllWorkspacesDocument, {}, options);
}
export type GetAllWorkspacesQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<GetAllWorkspacesQuery, GetAllWorkspacesQueryVariables>;
export const AgentTeamResponseDocument = gql`
    subscription AgentTeamResponse($teamId: String!) {
  agentTeamResponse(teamId: $teamId) {
    ...NestedTeamEvent
    data {
      ... on GraphQLSubTeamEventRebroadcastPayload {
        subTeamNodeName
        subTeamEvent {
          ...NestedTeamEvent
          data {
            ... on GraphQLSubTeamEventRebroadcastPayload {
              subTeamNodeName
              subTeamEvent {
                ...NestedTeamEvent
              }
            }
          }
        }
      }
    }
  }
}
    ${NestedTeamEventFragmentDoc}`;

/**
 * __useAgentTeamResponseSubscription__
 *
 * To run a query within a Vue component, call `useAgentTeamResponseSubscription` and pass it any options that fit your needs.
 * When your component renders, `useAgentTeamResponseSubscription` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the subscription
 * @param options that will be passed into the subscription, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/subscription.html#options;
 *
 * @example
 * const { result, loading, error } = useAgentTeamResponseSubscription({
 *   teamId: // value for 'teamId'
 * });
 */
export function useAgentTeamResponseSubscription(variables: AgentTeamResponseSubscriptionVariables | VueCompositionApi.Ref<AgentTeamResponseSubscriptionVariables> | ReactiveFunction<AgentTeamResponseSubscriptionVariables>, options: VueApolloComposable.UseSubscriptionOptions<AgentTeamResponseSubscription, AgentTeamResponseSubscriptionVariables> | VueCompositionApi.Ref<VueApolloComposable.UseSubscriptionOptions<AgentTeamResponseSubscription, AgentTeamResponseSubscriptionVariables>> | ReactiveFunction<VueApolloComposable.UseSubscriptionOptions<AgentTeamResponseSubscription, AgentTeamResponseSubscriptionVariables>> = {}) {
  return VueApolloComposable.useSubscription<AgentTeamResponseSubscription, AgentTeamResponseSubscriptionVariables>(AgentTeamResponseDocument, variables, options);
}
export type AgentTeamResponseSubscriptionCompositionFunctionResult = VueApolloComposable.UseSubscriptionReturn<AgentTeamResponseSubscription, AgentTeamResponseSubscriptionVariables>;
export const AgentResponseDocument = gql`
    subscription AgentResponse($agentId: String!) {
  agentResponse(agentId: $agentId) {
    eventId
    timestamp
    eventType
    agentId
    data {
      __typename
      ... on GraphQLAssistantChunkData {
        content
        reasoning
        isComplete
        usage {
          promptTokens
          completionTokens
          totalTokens
          promptCost
          completionCost
          totalCost
        }
        imageUrls
        audioUrls
        videoUrls
      }
      ... on GraphQLAssistantCompleteResponseData {
        content
        reasoning
        usage {
          promptTokens
          completionTokens
          totalTokens
          promptCost
          completionCost
          totalCost
        }
        imageUrls
        audioUrls
        videoUrls
      }
      ... on GraphQLToolInteractionLogEntryData {
        logEntry
        toolInvocationId
        toolName
      }
      ... on GraphQLAgentOperationalPhaseTransitionData {
        newPhase
        oldPhase
        trigger
        toolName
        errorMessage
        errorDetails
      }
      ... on GraphQLErrorEventData {
        source
        message
        details
      }
      ... on GraphQLToolInvocationApprovalRequestedData {
        invocationId
        toolName
        arguments
      }
      ... on GraphQLToolInvocationAutoExecutingData {
        invocationId
        toolName
        arguments
      }
      ... on GraphQLSystemTaskNotificationData {
        senderId
        content
      }
    }
  }
}
    `;

/**
 * __useAgentResponseSubscription__
 *
 * To run a query within a Vue component, call `useAgentResponseSubscription` and pass it any options that fit your needs.
 * When your component renders, `useAgentResponseSubscription` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the subscription
 * @param options that will be passed into the subscription, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/subscription.html#options;
 *
 * @example
 * const { result, loading, error } = useAgentResponseSubscription({
 *   agentId: // value for 'agentId'
 * });
 */
export function useAgentResponseSubscription(variables: AgentResponseSubscriptionVariables | VueCompositionApi.Ref<AgentResponseSubscriptionVariables> | ReactiveFunction<AgentResponseSubscriptionVariables>, options: VueApolloComposable.UseSubscriptionOptions<AgentResponseSubscription, AgentResponseSubscriptionVariables> | VueCompositionApi.Ref<VueApolloComposable.UseSubscriptionOptions<AgentResponseSubscription, AgentResponseSubscriptionVariables>> | ReactiveFunction<VueApolloComposable.UseSubscriptionOptions<AgentResponseSubscription, AgentResponseSubscriptionVariables>> = {}) {
  return VueApolloComposable.useSubscription<AgentResponseSubscription, AgentResponseSubscriptionVariables>(AgentResponseDocument, variables, options);
}
export type AgentResponseSubscriptionCompositionFunctionResult = VueApolloComposable.UseSubscriptionReturn<AgentResponseSubscription, AgentResponseSubscriptionVariables>;
export const FileSystemChangedDocument = gql`
    subscription FileSystemChanged($workspaceId: String!) {
  fileSystemChanged(workspaceId: $workspaceId)
}
    `;

/**
 * __useFileSystemChangedSubscription__
 *
 * To run a query within a Vue component, call `useFileSystemChangedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useFileSystemChangedSubscription` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the subscription
 * @param options that will be passed into the subscription, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/subscription.html#options;
 *
 * @example
 * const { result, loading, error } = useFileSystemChangedSubscription({
 *   workspaceId: // value for 'workspaceId'
 * });
 */
export function useFileSystemChangedSubscription(variables: FileSystemChangedSubscriptionVariables | VueCompositionApi.Ref<FileSystemChangedSubscriptionVariables> | ReactiveFunction<FileSystemChangedSubscriptionVariables>, options: VueApolloComposable.UseSubscriptionOptions<FileSystemChangedSubscription, FileSystemChangedSubscriptionVariables> | VueCompositionApi.Ref<VueApolloComposable.UseSubscriptionOptions<FileSystemChangedSubscription, FileSystemChangedSubscriptionVariables>> | ReactiveFunction<VueApolloComposable.UseSubscriptionOptions<FileSystemChangedSubscription, FileSystemChangedSubscriptionVariables>> = {}) {
  return VueApolloComposable.useSubscription<FileSystemChangedSubscription, FileSystemChangedSubscriptionVariables>(FileSystemChangedDocument, variables, options);
}
export type FileSystemChangedSubscriptionCompositionFunctionResult = VueApolloComposable.UseSubscriptionReturn<FileSystemChangedSubscription, FileSystemChangedSubscriptionVariables>;