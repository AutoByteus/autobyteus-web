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

export type CommandExecutionResult = {
  __typename?: 'CommandExecutionResult';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type ContextFilePathInput = {
  path: Scalars['String']['input'];
  type: Scalars['String']['input'];
};

export type ConversationHistory = {
  __typename?: 'ConversationHistory';
  conversations: Array<StepConversation>;
  currentPage: Scalars['Int']['output'];
  totalConversations: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type CreatePromptInput = {
  category: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  promptContent: Scalars['String']['input'];
  suitableForModels?: InputMaybe<Scalars['String']['input']>;
};

export type DeletePromptInput = {
  id: Scalars['String']['input'];
};

export type DeletePromptResult = {
  __typename?: 'DeletePromptResult';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type MarkActivePromptInput = {
  id: Scalars['String']['input'];
};

export type Message = {
  __typename?: 'Message';
  contextPaths?: Maybe<Array<Scalars['String']['output']>>;
  cost?: Maybe<Scalars['Float']['output']>;
  message: Scalars['String']['output'];
  messageId?: Maybe<Scalars['String']['output']>;
  originalMessage?: Maybe<Scalars['String']['output']>;
  role: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
  tokenCount?: Maybe<Scalars['Int']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  addWorkspace: WorkspaceInfo;
  closeConversation: Scalars['Boolean']['output'];
  createFileOrFolder: Scalars['String']['output'];
  createPrompt: Prompt;
  deleteFileOrFolder: Scalars['String']['output'];
  deletePrompt: DeletePromptResult;
  executeBashCommands: CommandExecutionResult;
  markActivePrompt: Prompt;
  moveFileOrFolder: Scalars['String']['output'];
  reloadLlmModels: Scalars['String']['output'];
  renameFileOrFolder: Scalars['String']['output'];
  sendStepRequirement: Scalars['String']['output'];
  setLlmProviderApiKey: Scalars['String']['output'];
  startWorkflow: Scalars['Boolean']['output'];
  syncPrompts: SyncPromptsResult;
  updatePrompt: Prompt;
  updateServerSetting: Scalars['String']['output'];
  writeFileContent: Scalars['String']['output'];
};


export type MutationAddWorkspaceArgs = {
  workspaceRootPath: Scalars['String']['input'];
};


export type MutationCloseConversationArgs = {
  conversationId: Scalars['String']['input'];
  stepId: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};


export type MutationCreateFileOrFolderArgs = {
  isFile: Scalars['Boolean']['input'];
  path: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};


export type MutationCreatePromptArgs = {
  input: CreatePromptInput;
};


export type MutationDeleteFileOrFolderArgs = {
  path: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};


export type MutationDeletePromptArgs = {
  input: DeletePromptInput;
};


export type MutationExecuteBashCommandsArgs = {
  command: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
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


export type MutationSendStepRequirementArgs = {
  contextFilePaths: Array<ContextFilePathInput>;
  conversationId?: InputMaybe<Scalars['String']['input']>;
  llmModel?: InputMaybe<Scalars['String']['input']>;
  requirement: Scalars['String']['input'];
  stepId: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};


export type MutationSetLlmProviderApiKeyArgs = {
  apiKey: Scalars['String']['input'];
  provider: Scalars['String']['input'];
};


export type MutationStartWorkflowArgs = {
  workspaceId: Scalars['String']['input'];
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

export type Prompt = {
  __typename?: 'Prompt';
  category: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  parentPromptId?: Maybe<Scalars['String']['output']>;
  promptContent: Scalars['String']['output'];
  suitableForModels?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type Query = {
  __typename?: 'Query';
  activePrompts: Array<Prompt>;
  allWorkspaces: Array<WorkspaceInfo>;
  availableModels: Array<Scalars['String']['output']>;
  availableProviders: Array<Scalars['String']['output']>;
  fileContent: Scalars['String']['output'];
  getAvailableWorkspaceTools: Array<WorkspaceTool>;
  getConversationHistory: ConversationHistory;
  getLlmProviderApiKey?: Maybe<Scalars['String']['output']>;
  getServerSettings: Array<ServerSetting>;
  hackathonSearch: Array<Scalars['String']['output']>;
  promptDetails?: Maybe<Prompt>;
  searchCodeEntities: Scalars['JSON']['output'];
  searchFiles: Array<Scalars['String']['output']>;
  totalCostInPeriod: Scalars['Float']['output'];
  usageStatisticsInPeriod: Array<UsageStatistics>;
  workflowConfig: Scalars['JSON']['output'];
};


export type QueryFileContentArgs = {
  filePath: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};


export type QueryGetAvailableWorkspaceToolsArgs = {
  workspaceId: Scalars['String']['input'];
};


export type QueryGetConversationHistoryArgs = {
  page?: Scalars['Int']['input'];
  pageSize?: Scalars['Int']['input'];
  stepName: Scalars['String']['input'];
};


export type QueryGetLlmProviderApiKeyArgs = {
  provider: Scalars['String']['input'];
};


export type QueryHackathonSearchArgs = {
  query: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};


export type QueryPromptDetailsArgs = {
  id: Scalars['String']['input'];
};


export type QuerySearchCodeEntitiesArgs = {
  query: Scalars['String']['input'];
};


export type QuerySearchFilesArgs = {
  query: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};


export type QueryTotalCostInPeriodArgs = {
  endTime: Scalars['DateTime']['input'];
  startTime: Scalars['DateTime']['input'];
};


export type QueryUsageStatisticsInPeriodArgs = {
  endTime: Scalars['DateTime']['input'];
  startTime: Scalars['DateTime']['input'];
};


export type QueryWorkflowConfigArgs = {
  workspaceId: Scalars['String']['input'];
};

export type ServerSetting = {
  __typename?: 'ServerSetting';
  description: Scalars['String']['output'];
  key: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type StepConversation = {
  __typename?: 'StepConversation';
  createdAt: Scalars['String']['output'];
  messages: Array<Message>;
  stepConversationId: Scalars['String']['output'];
  stepName: Scalars['String']['output'];
};

export type StepResponse = {
  __typename?: 'StepResponse';
  completionCost?: Maybe<Scalars['Float']['output']>;
  completionTokens?: Maybe<Scalars['Int']['output']>;
  conversationId: Scalars['String']['output'];
  isComplete: Scalars['Boolean']['output'];
  messageChunk: Scalars['String']['output'];
  promptCost?: Maybe<Scalars['Float']['output']>;
  promptTokens?: Maybe<Scalars['Int']['output']>;
  totalCost?: Maybe<Scalars['Float']['output']>;
  totalTokens?: Maybe<Scalars['Int']['output']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  stepResponse: StepResponse;
};


export type SubscriptionStepResponseArgs = {
  conversationId: Scalars['String']['input'];
  stepId: Scalars['String']['input'];
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

export type UpdatePromptInput = {
  id: Scalars['String']['input'];
  newPromptContent: Scalars['String']['input'];
};

export type UsageStatistics = {
  __typename?: 'UsageStatistics';
  assistantCost: Scalars['Float']['output'];
  assistantTokens: Scalars['Int']['output'];
  llmModel: Scalars['String']['output'];
  promptCost: Scalars['Float']['output'];
  promptTokens: Scalars['Int']['output'];
  totalCost: Scalars['Float']['output'];
};

export type WorkspaceInfo = {
  __typename?: 'WorkspaceInfo';
  fileExplorer: Scalars['JSON']['output'];
  name: Scalars['String']['output'];
  workspaceId: Scalars['String']['output'];
};

export type WorkspaceTool = {
  __typename?: 'WorkspaceTool';
  name: Scalars['String']['output'];
  promptTemplate: Scalars['String']['output'];
};

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

export type CreatePromptMutationVariables = Exact<{
  input: CreatePromptInput;
}>;


export type CreatePromptMutation = { __typename?: 'Mutation', createPrompt: { __typename?: 'Prompt', id: string, name: string, category: string, promptContent: string, description?: string | null, suitableForModels?: string | null, version: number, createdAt: any, parentPromptId?: string | null } };

export type SyncPromptsMutationVariables = Exact<{ [key: string]: never; }>;


export type SyncPromptsMutation = { __typename?: 'Mutation', syncPrompts: { __typename?: 'SyncPromptsResult', success: boolean, message: string, initialCount: number, finalCount: number, syncedCount: number } };

export type DeletePromptMutationVariables = Exact<{
  input: DeletePromptInput;
}>;


export type DeletePromptMutation = { __typename?: 'Mutation', deletePrompt: { __typename?: 'DeletePromptResult', success: boolean, message: string } };

export type UpdateServerSettingMutationVariables = Exact<{
  key: Scalars['String']['input'];
  value: Scalars['String']['input'];
}>;


export type UpdateServerSettingMutation = { __typename?: 'Mutation', updateServerSetting: string };

export type SendStepRequirementMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  stepId: Scalars['String']['input'];
  contextFilePaths: Array<ContextFilePathInput> | ContextFilePathInput;
  requirement: Scalars['String']['input'];
  conversationId?: InputMaybe<Scalars['String']['input']>;
  llmModel?: InputMaybe<Scalars['String']['input']>;
}>;


export type SendStepRequirementMutation = { __typename?: 'Mutation', sendStepRequirement: string };

export type CloseConversationMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  stepId: Scalars['String']['input'];
  conversationId: Scalars['String']['input'];
}>;


export type CloseConversationMutation = { __typename?: 'Mutation', closeConversation: boolean };

export type AddWorkspaceMutationVariables = Exact<{
  workspaceRootPath: Scalars['String']['input'];
}>;


export type AddWorkspaceMutation = { __typename?: 'Mutation', addWorkspace: { __typename?: 'WorkspaceInfo', workspaceId: string, name: string, fileExplorer: any } };

export type ExecuteBashCommandsMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  command: Scalars['String']['input'];
}>;


export type ExecuteBashCommandsMutation = { __typename?: 'Mutation', executeBashCommands: { __typename?: 'CommandExecutionResult', success: boolean, message: string } };

export type SearchCodeEntitiesQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type SearchCodeEntitiesQuery = { __typename?: 'Query', searchCodeEntities: any };

export type SearchContextFilesQueryVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  query: Scalars['String']['input'];
}>;


export type SearchContextFilesQuery = { __typename?: 'Query', hackathonSearch: Array<string> };

export type GetConversationHistoryQueryVariables = Exact<{
  stepName: Scalars['String']['input'];
  page: Scalars['Int']['input'];
  pageSize: Scalars['Int']['input'];
}>;


export type GetConversationHistoryQuery = { __typename?: 'Query', getConversationHistory: { __typename?: 'ConversationHistory', totalConversations: number, totalPages: number, currentPage: number, conversations: Array<{ __typename?: 'StepConversation', stepConversationId: string, stepName: string, createdAt: string, messages: Array<{ __typename?: 'Message', messageId?: string | null, role: string, message: string, timestamp: string, contextPaths?: Array<string> | null, originalMessage?: string | null, tokenCount?: number | null, cost?: number | null }> }> } };

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

export type GetAvailableModelsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAvailableModelsQuery = { __typename?: 'Query', availableModels: Array<string> };

export type GetAvailableProvidersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAvailableProvidersQuery = { __typename?: 'Query', availableProviders: Array<string> };

export type GetPromptsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetPromptsQuery = { __typename?: 'Query', activePrompts: Array<{ __typename?: 'Prompt', id: string, name: string, category: string, promptContent: string, description?: string | null, suitableForModels?: string | null, version: number, createdAt: any, parentPromptId?: string | null }> };

export type GetPromptByIdQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetPromptByIdQuery = { __typename?: 'Query', promptDetails?: { __typename?: 'Prompt', id: string, name: string, category: string, promptContent: string, description?: string | null, suitableForModels?: string | null, version: number, createdAt: any, updatedAt: any, parentPromptId?: string | null } | null };

export type GetServerSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetServerSettingsQuery = { __typename?: 'Query', getServerSettings: Array<{ __typename?: 'ServerSetting', key: string, value: string, description: string }> };

export type GetUsageStatisticsInPeriodQueryVariables = Exact<{
  startTime: Scalars['DateTime']['input'];
  endTime: Scalars['DateTime']['input'];
}>;


export type GetUsageStatisticsInPeriodQuery = { __typename?: 'Query', usageStatisticsInPeriod: Array<{ __typename?: 'UsageStatistics', llmModel: string, promptTokens: number, assistantTokens: number, promptCost: number, assistantCost: number, totalCost: number }> };

export type GetWorkflowConfigQueryVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type GetWorkflowConfigQuery = { __typename?: 'Query', workflowConfig: any };

export type GetAllWorkspacesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAllWorkspacesQuery = { __typename?: 'Query', allWorkspaces: Array<{ __typename?: 'WorkspaceInfo', workspaceId: string, name: string, fileExplorer: any }> };

export type StepResponseSubscriptionVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  stepId: Scalars['String']['input'];
  conversationId: Scalars['String']['input'];
}>;


export type StepResponseSubscription = { __typename?: 'Subscription', stepResponse: { __typename?: 'StepResponse', conversationId: string, messageChunk: string, isComplete: boolean, promptTokens?: number | null, completionTokens?: number | null, totalTokens?: number | null, promptCost?: number | null, completionCost?: number | null, totalCost?: number | null } };


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
export const CreatePromptDocument = gql`
    mutation CreatePrompt($input: CreatePromptInput!) {
  createPrompt(input: $input) {
    id
    name
    category
    promptContent
    description
    suitableForModels
    version
    createdAt
    parentPromptId
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
export const SyncPromptsDocument = gql`
    mutation SyncPrompts {
  syncPrompts {
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
export const SendStepRequirementDocument = gql`
    mutation SendStepRequirement($workspaceId: String!, $stepId: String!, $contextFilePaths: [ContextFilePathInput!]!, $requirement: String!, $conversationId: String, $llmModel: String) {
  sendStepRequirement(
    workspaceId: $workspaceId
    stepId: $stepId
    contextFilePaths: $contextFilePaths
    requirement: $requirement
    conversationId: $conversationId
    llmModel: $llmModel
  )
}
    `;

/**
 * __useSendStepRequirementMutation__
 *
 * To run a mutation, you first call `useSendStepRequirementMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useSendStepRequirementMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useSendStepRequirementMutation({
 *   variables: {
 *     workspaceId: // value for 'workspaceId'
 *     stepId: // value for 'stepId'
 *     contextFilePaths: // value for 'contextFilePaths'
 *     requirement: // value for 'requirement'
 *     conversationId: // value for 'conversationId'
 *     llmModel: // value for 'llmModel'
 *   },
 * });
 */
export function useSendStepRequirementMutation(options: VueApolloComposable.UseMutationOptions<SendStepRequirementMutation, SendStepRequirementMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<SendStepRequirementMutation, SendStepRequirementMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<SendStepRequirementMutation, SendStepRequirementMutationVariables>(SendStepRequirementDocument, options);
}
export type SendStepRequirementMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<SendStepRequirementMutation, SendStepRequirementMutationVariables>;
export const CloseConversationDocument = gql`
    mutation CloseConversation($workspaceId: String!, $stepId: String!, $conversationId: String!) {
  closeConversation(
    workspaceId: $workspaceId
    stepId: $stepId
    conversationId: $conversationId
  )
}
    `;

/**
 * __useCloseConversationMutation__
 *
 * To run a mutation, you first call `useCloseConversationMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useCloseConversationMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useCloseConversationMutation({
 *   variables: {
 *     workspaceId: // value for 'workspaceId'
 *     stepId: // value for 'stepId'
 *     conversationId: // value for 'conversationId'
 *   },
 * });
 */
export function useCloseConversationMutation(options: VueApolloComposable.UseMutationOptions<CloseConversationMutation, CloseConversationMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<CloseConversationMutation, CloseConversationMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<CloseConversationMutation, CloseConversationMutationVariables>(CloseConversationDocument, options);
}
export type CloseConversationMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<CloseConversationMutation, CloseConversationMutationVariables>;
export const AddWorkspaceDocument = gql`
    mutation AddWorkspace($workspaceRootPath: String!) {
  addWorkspace(workspaceRootPath: $workspaceRootPath) {
    workspaceId
    name
    fileExplorer
  }
}
    `;

/**
 * __useAddWorkspaceMutation__
 *
 * To run a mutation, you first call `useAddWorkspaceMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useAddWorkspaceMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useAddWorkspaceMutation({
 *   variables: {
 *     workspaceRootPath: // value for 'workspaceRootPath'
 *   },
 * });
 */
export function useAddWorkspaceMutation(options: VueApolloComposable.UseMutationOptions<AddWorkspaceMutation, AddWorkspaceMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<AddWorkspaceMutation, AddWorkspaceMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<AddWorkspaceMutation, AddWorkspaceMutationVariables>(AddWorkspaceDocument, options);
}
export type AddWorkspaceMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<AddWorkspaceMutation, AddWorkspaceMutationVariables>;
export const ExecuteBashCommandsDocument = gql`
    mutation ExecuteBashCommands($workspaceId: String!, $command: String!) {
  executeBashCommands(workspaceId: $workspaceId, command: $command) {
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
export const SearchCodeEntitiesDocument = gql`
    query SearchCodeEntities($query: String!) {
  searchCodeEntities(query: $query)
}
    `;

/**
 * __useSearchCodeEntitiesQuery__
 *
 * To run a query within a Vue component, call `useSearchCodeEntitiesQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchCodeEntitiesQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the query
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useSearchCodeEntitiesQuery({
 *   query: // value for 'query'
 * });
 */
export function useSearchCodeEntitiesQuery(variables: SearchCodeEntitiesQueryVariables | VueCompositionApi.Ref<SearchCodeEntitiesQueryVariables> | ReactiveFunction<SearchCodeEntitiesQueryVariables>, options: VueApolloComposable.UseQueryOptions<SearchCodeEntitiesQuery, SearchCodeEntitiesQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<SearchCodeEntitiesQuery, SearchCodeEntitiesQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<SearchCodeEntitiesQuery, SearchCodeEntitiesQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<SearchCodeEntitiesQuery, SearchCodeEntitiesQueryVariables>(SearchCodeEntitiesDocument, variables, options);
}
export function useSearchCodeEntitiesLazyQuery(variables?: SearchCodeEntitiesQueryVariables | VueCompositionApi.Ref<SearchCodeEntitiesQueryVariables> | ReactiveFunction<SearchCodeEntitiesQueryVariables>, options: VueApolloComposable.UseQueryOptions<SearchCodeEntitiesQuery, SearchCodeEntitiesQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<SearchCodeEntitiesQuery, SearchCodeEntitiesQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<SearchCodeEntitiesQuery, SearchCodeEntitiesQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<SearchCodeEntitiesQuery, SearchCodeEntitiesQueryVariables>(SearchCodeEntitiesDocument, variables, options);
}
export type SearchCodeEntitiesQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<SearchCodeEntitiesQuery, SearchCodeEntitiesQueryVariables>;
export const SearchContextFilesDocument = gql`
    query SearchContextFiles($workspaceId: String!, $query: String!) {
  hackathonSearch(workspaceId: $workspaceId, query: $query)
}
    `;

/**
 * __useSearchContextFilesQuery__
 *
 * To run a query within a Vue component, call `useSearchContextFilesQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchContextFilesQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the query
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useSearchContextFilesQuery({
 *   workspaceId: // value for 'workspaceId'
 *   query: // value for 'query'
 * });
 */
export function useSearchContextFilesQuery(variables: SearchContextFilesQueryVariables | VueCompositionApi.Ref<SearchContextFilesQueryVariables> | ReactiveFunction<SearchContextFilesQueryVariables>, options: VueApolloComposable.UseQueryOptions<SearchContextFilesQuery, SearchContextFilesQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<SearchContextFilesQuery, SearchContextFilesQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<SearchContextFilesQuery, SearchContextFilesQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<SearchContextFilesQuery, SearchContextFilesQueryVariables>(SearchContextFilesDocument, variables, options);
}
export function useSearchContextFilesLazyQuery(variables?: SearchContextFilesQueryVariables | VueCompositionApi.Ref<SearchContextFilesQueryVariables> | ReactiveFunction<SearchContextFilesQueryVariables>, options: VueApolloComposable.UseQueryOptions<SearchContextFilesQuery, SearchContextFilesQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<SearchContextFilesQuery, SearchContextFilesQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<SearchContextFilesQuery, SearchContextFilesQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<SearchContextFilesQuery, SearchContextFilesQueryVariables>(SearchContextFilesDocument, variables, options);
}
export type SearchContextFilesQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<SearchContextFilesQuery, SearchContextFilesQueryVariables>;
export const GetConversationHistoryDocument = gql`
    query GetConversationHistory($stepName: String!, $page: Int!, $pageSize: Int!) {
  getConversationHistory(stepName: $stepName, page: $page, pageSize: $pageSize) {
    conversations {
      stepConversationId
      stepName
      createdAt
      messages {
        messageId
        role
        message
        timestamp
        contextPaths
        originalMessage
        tokenCount
        cost
      }
    }
    totalConversations
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
 *   stepName: // value for 'stepName'
 *   page: // value for 'page'
 *   pageSize: // value for 'pageSize'
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
export const GetAvailableModelsDocument = gql`
    query GetAvailableModels {
  availableModels
}
    `;

/**
 * __useGetAvailableModelsQuery__
 *
 * To run a query within a Vue component, call `useGetAvailableModelsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAvailableModelsQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useGetAvailableModelsQuery();
 */
export function useGetAvailableModelsQuery(options: VueApolloComposable.UseQueryOptions<GetAvailableModelsQuery, GetAvailableModelsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetAvailableModelsQuery, GetAvailableModelsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetAvailableModelsQuery, GetAvailableModelsQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<GetAvailableModelsQuery, GetAvailableModelsQueryVariables>(GetAvailableModelsDocument, {}, options);
}
export function useGetAvailableModelsLazyQuery(options: VueApolloComposable.UseQueryOptions<GetAvailableModelsQuery, GetAvailableModelsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetAvailableModelsQuery, GetAvailableModelsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetAvailableModelsQuery, GetAvailableModelsQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<GetAvailableModelsQuery, GetAvailableModelsQueryVariables>(GetAvailableModelsDocument, {}, options);
}
export type GetAvailableModelsQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<GetAvailableModelsQuery, GetAvailableModelsQueryVariables>;
export const GetAvailableProvidersDocument = gql`
    query GetAvailableProviders {
  availableProviders
}
    `;

/**
 * __useGetAvailableProvidersQuery__
 *
 * To run a query within a Vue component, call `useGetAvailableProvidersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAvailableProvidersQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useGetAvailableProvidersQuery();
 */
export function useGetAvailableProvidersQuery(options: VueApolloComposable.UseQueryOptions<GetAvailableProvidersQuery, GetAvailableProvidersQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetAvailableProvidersQuery, GetAvailableProvidersQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetAvailableProvidersQuery, GetAvailableProvidersQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<GetAvailableProvidersQuery, GetAvailableProvidersQueryVariables>(GetAvailableProvidersDocument, {}, options);
}
export function useGetAvailableProvidersLazyQuery(options: VueApolloComposable.UseQueryOptions<GetAvailableProvidersQuery, GetAvailableProvidersQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetAvailableProvidersQuery, GetAvailableProvidersQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetAvailableProvidersQuery, GetAvailableProvidersQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<GetAvailableProvidersQuery, GetAvailableProvidersQueryVariables>(GetAvailableProvidersDocument, {}, options);
}
export type GetAvailableProvidersQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<GetAvailableProvidersQuery, GetAvailableProvidersQueryVariables>;
export const GetPromptsDocument = gql`
    query GetPrompts {
  activePrompts {
    id
    name
    category
    promptContent
    description
    suitableForModels
    version
    createdAt
    parentPromptId
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
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useGetPromptsQuery();
 */
export function useGetPromptsQuery(options: VueApolloComposable.UseQueryOptions<GetPromptsQuery, GetPromptsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetPromptsQuery, GetPromptsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetPromptsQuery, GetPromptsQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<GetPromptsQuery, GetPromptsQueryVariables>(GetPromptsDocument, {}, options);
}
export function useGetPromptsLazyQuery(options: VueApolloComposable.UseQueryOptions<GetPromptsQuery, GetPromptsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetPromptsQuery, GetPromptsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetPromptsQuery, GetPromptsQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<GetPromptsQuery, GetPromptsQueryVariables>(GetPromptsDocument, {}, options);
}
export type GetPromptsQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<GetPromptsQuery, GetPromptsQueryVariables>;
export const GetPromptByIdDocument = gql`
    query GetPromptById($id: String!) {
  promptDetails(id: $id) {
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
export const GetServerSettingsDocument = gql`
    query GetServerSettings {
  getServerSettings {
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
export const GetWorkflowConfigDocument = gql`
    query GetWorkflowConfig($workspaceId: String!) {
  workflowConfig(workspaceId: $workspaceId)
}
    `;

/**
 * __useGetWorkflowConfigQuery__
 *
 * To run a query within a Vue component, call `useGetWorkflowConfigQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetWorkflowConfigQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the query
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useGetWorkflowConfigQuery({
 *   workspaceId: // value for 'workspaceId'
 * });
 */
export function useGetWorkflowConfigQuery(variables: GetWorkflowConfigQueryVariables | VueCompositionApi.Ref<GetWorkflowConfigQueryVariables> | ReactiveFunction<GetWorkflowConfigQueryVariables>, options: VueApolloComposable.UseQueryOptions<GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables>(GetWorkflowConfigDocument, variables, options);
}
export function useGetWorkflowConfigLazyQuery(variables?: GetWorkflowConfigQueryVariables | VueCompositionApi.Ref<GetWorkflowConfigQueryVariables> | ReactiveFunction<GetWorkflowConfigQueryVariables>, options: VueApolloComposable.UseQueryOptions<GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables>(GetWorkflowConfigDocument, variables, options);
}
export type GetWorkflowConfigQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables>;
export const GetAllWorkspacesDocument = gql`
    query GetAllWorkspaces {
  allWorkspaces {
    workspaceId
    name
    fileExplorer
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
export const StepResponseDocument = gql`
    subscription StepResponse($workspaceId: String!, $stepId: String!, $conversationId: String!) {
  stepResponse(
    workspaceId: $workspaceId
    stepId: $stepId
    conversationId: $conversationId
  ) {
    conversationId
    messageChunk
    isComplete
    promptTokens
    completionTokens
    totalTokens
    promptCost
    completionCost
    totalCost
  }
}
    `;

/**
 * __useStepResponseSubscription__
 *
 * To run a query within a Vue component, call `useStepResponseSubscription` and pass it any options that fit your needs.
 * When your component renders, `useStepResponseSubscription` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the subscription
 * @param options that will be passed into the subscription, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/subscription.html#options;
 *
 * @example
 * const { result, loading, error } = useStepResponseSubscription({
 *   workspaceId: // value for 'workspaceId'
 *   stepId: // value for 'stepId'
 *   conversationId: // value for 'conversationId'
 * });
 */
export function useStepResponseSubscription(variables: StepResponseSubscriptionVariables | VueCompositionApi.Ref<StepResponseSubscriptionVariables> | ReactiveFunction<StepResponseSubscriptionVariables>, options: VueApolloComposable.UseSubscriptionOptions<StepResponseSubscription, StepResponseSubscriptionVariables> | VueCompositionApi.Ref<VueApolloComposable.UseSubscriptionOptions<StepResponseSubscription, StepResponseSubscriptionVariables>> | ReactiveFunction<VueApolloComposable.UseSubscriptionOptions<StepResponseSubscription, StepResponseSubscriptionVariables>> = {}) {
  return VueApolloComposable.useSubscription<StepResponseSubscription, StepResponseSubscriptionVariables>(StepResponseDocument, variables, options);
}
export type StepResponseSubscriptionCompositionFunctionResult = VueApolloComposable.UseSubscriptionReturn<StepResponseSubscription, StepResponseSubscriptionVariables>;