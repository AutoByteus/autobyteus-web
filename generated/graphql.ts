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
  JSON: { input: any; output: any; }
};

export enum LlmModel {
  Claude_3_5Sonnet = 'CLAUDE_3_5_SONNET',
  Claude_3_5SonnetApi = 'CLAUDE_3_5_SONNET_API',
  Claude_3Haiku = 'CLAUDE_3_HAIKU',
  Claude_3HaikuApi = 'CLAUDE_3_HAIKU_API',
  Claude_3Opus = 'CLAUDE_3_OPUS',
  Claude_3OpusApi = 'CLAUDE_3_OPUS_API',
  Gemini_1_0Pro = 'GEMINI_1_0_PRO',
  Gemini_1_0ProApi = 'GEMINI_1_0_PRO_API',
  Gemini_1_5Flash = 'GEMINI_1_5_FLASH',
  Gemini_1_5FlashApi = 'GEMINI_1_5_FLASH_API',
  Gemini_1_5Pro = 'GEMINI_1_5_PRO',
  Gemini_1_5ProApi = 'GEMINI_1_5_PRO_API',
  Gemini_1_5ProExperimental = 'GEMINI_1_5_PRO_EXPERIMENTAL',
  Gemini_1_5ProExperimentalApi = 'GEMINI_1_5_PRO_EXPERIMENTAL_API',
  Gemma_2_2B = 'GEMMA_2_2B',
  Gemma_2_2BApi = 'GEMMA_2_2B_API',
  Gemma_2_9B = 'GEMMA_2_9B',
  Gemma_2_9BApi = 'GEMMA_2_9B_API',
  Gemma_2_9BIt = 'GEMMA_2_9B_IT',
  Gemma_2_9BItApi = 'GEMMA_2_9B_IT_API',
  Gemma_2_27B = 'GEMMA_2_27B',
  Gemma_2_27BApi = 'GEMMA_2_27B_API',
  Gemma_2_27BIt = 'GEMMA_2_27B_IT',
  Gemma_2_27BItApi = 'GEMMA_2_27B_IT_API',
  Gemma_7BIt = 'GEMMA_7B_IT',
  Gemma_7BItApi = 'GEMMA_7B_IT_API',
  Gpt_4Api = 'GPT_4_API',
  Gpt_4o = 'GPT_4o',
  Llama3_8B_8192 = 'LLAMA3_8B_8192',
  Llama3_8B_8192Api = 'LLAMA3_8B_8192_API',
  Llama3_70B_8192 = 'LLAMA3_70B_8192',
  Llama3_70B_8192Api = 'LLAMA3_70B_8192_API',
  Llama_3_1_8BInstant = 'LLAMA_3_1_8B_INSTANT',
  Llama_3_1_8BInstantApi = 'LLAMA_3_1_8B_INSTANT_API',
  Llama_3_1_8BInstruct = 'LLAMA_3_1_8B_INSTRUCT',
  Llama_3_1_8BInstructApi = 'LLAMA_3_1_8B_INSTRUCT_API',
  Llama_3_1_70BInstruct = 'LLAMA_3_1_70B_INSTRUCT',
  Llama_3_1_70BInstructApi = 'LLAMA_3_1_70B_INSTRUCT_API',
  Llama_3_1_70BVersatile = 'LLAMA_3_1_70B_VERSATILE',
  Llama_3_1_70BVersatileApi = 'LLAMA_3_1_70B_VERSATILE_API',
  Llama_3_1_405BReasoning = 'LLAMA_3_1_405B_REASONING',
  Llama_3_1_405BReasoningApi = 'LLAMA_3_1_405B_REASONING_API',
  Llama_3_1SonarLarge_128KChat = 'LLAMA_3_1_SONAR_LARGE_128K_CHAT',
  Llama_3_1SonarLarge_128KChatApi = 'LLAMA_3_1_SONAR_LARGE_128K_CHAT_API',
  Llama_3_1SonarLarge_128KOnline = 'LLAMA_3_1_SONAR_LARGE_128K_ONLINE',
  Llama_3_1SonarLarge_128KOnlineApi = 'LLAMA_3_1_SONAR_LARGE_128K_ONLINE_API',
  Llama_3_1SonarSmall_128KChat = 'LLAMA_3_1_SONAR_SMALL_128K_CHAT',
  Llama_3_1SonarSmall_128KChatApi = 'LLAMA_3_1_SONAR_SMALL_128K_CHAT_API',
  Llama_3_1SonarSmall_128KOnline = 'LLAMA_3_1_SONAR_SMALL_128K_ONLINE',
  Llama_3_1SonarSmall_128KOnlineApi = 'LLAMA_3_1_SONAR_SMALL_128K_ONLINE_API',
  MistralLarge = 'MISTRAL_LARGE',
  MistralLargeApi = 'MISTRAL_LARGE_API',
  MistralMedium = 'MISTRAL_MEDIUM',
  MistralMediumApi = 'MISTRAL_MEDIUM_API',
  MistralSmall = 'MISTRAL_SMALL',
  MistralSmallApi = 'MISTRAL_SMALL_API',
  Mixtral_8X7B_32768 = 'MIXTRAL_8X7B_32768',
  Mixtral_8X7B_32768Api = 'MIXTRAL_8X7B_32768_API',
  Mixtral_8X7BInstruct = 'MIXTRAL_8X7B_INSTRUCT',
  Mixtral_8X7BInstructApi = 'MIXTRAL_8X7B_INSTRUCT_API',
  Nemotron_4_340BInstruct = 'NEMOTRON_4_340B_INSTRUCT',
  Nemotron_4_340BInstructApi = 'NEMOTRON_4_340B_INSTRUCT_API',
  O1MiniApi = 'O1_MINI_API',
  O1PreviewApi = 'O1_PREVIEW_API',
  O1Mini = 'o1_MINI',
  O1Preview = 'o1_PREVIEW'
}

export type Mutation = {
  __typename?: 'Mutation';
  addWorkspace: Scalars['JSON']['output'];
  configureStepLlm: Scalars['String']['output'];
  sendStepRequirement: Scalars['String']['output'];
  startWorkflow: Scalars['Boolean']['output'];
};


export type MutationAddWorkspaceArgs = {
  workspaceRootPath: Scalars['String']['input'];
};


export type MutationConfigureStepLlmArgs = {
  llmModel: LlmModel;
  stepId: Scalars['String']['input'];
  workspaceRootPath: Scalars['String']['input'];
};


export type MutationSendStepRequirementArgs = {
  contextFilePaths: Array<Scalars['String']['input']>;
  llmModel?: InputMaybe<LlmModel>;
  requirement: Scalars['String']['input'];
  stepId: Scalars['String']['input'];
  workspaceRootPath: Scalars['String']['input'];
};


export type MutationStartWorkflowArgs = {
  workspaceRootPath: Scalars['String']['input'];
};

export type Query = {
  __typename?: 'Query';
  fileContent: Scalars['String']['output'];
  getAvailableWorkspaceTools: Array<WorkspaceTool>;
  searchCodeEntities: Scalars['JSON']['output'];
  workflowConfig: Scalars['JSON']['output'];
};


export type QueryFileContentArgs = {
  filePath: Scalars['String']['input'];
  workspaceRootPath: Scalars['String']['input'];
};


export type QueryGetAvailableWorkspaceToolsArgs = {
  workspaceRootPath: Scalars['String']['input'];
};


export type QuerySearchCodeEntitiesArgs = {
  query: Scalars['String']['input'];
};


export type QueryWorkflowConfigArgs = {
  workspaceRootPath: Scalars['String']['input'];
};

export type Subscription = {
  __typename?: 'Subscription';
  stepResponse: Scalars['String']['output'];
};


export type SubscriptionStepResponseArgs = {
  stepId: Scalars['String']['input'];
  workspaceRootPath: Scalars['String']['input'];
};

export type WorkspaceTool = {
  __typename?: 'WorkspaceTool';
  name: Scalars['String']['output'];
  promptTemplate: Scalars['String']['output'];
};

export type SendStepRequirementMutationVariables = Exact<{
  workspaceRootPath: Scalars['String']['input'];
  stepId: Scalars['String']['input'];
  contextFilePaths: Array<Scalars['String']['input']> | Scalars['String']['input'];
  requirement: Scalars['String']['input'];
  llmModel?: InputMaybe<LlmModel>;
}>;


export type SendStepRequirementMutation = { __typename?: 'Mutation', sendStepRequirement: string };

export type ConfigureStepLlmMutationVariables = Exact<{
  workspaceRootPath: Scalars['String']['input'];
  stepId: Scalars['String']['input'];
  llmModel: LlmModel;
}>;


export type ConfigureStepLlmMutation = { __typename?: 'Mutation', configureStepLlm: string };

export type AddWorkspaceMutationVariables = Exact<{
  workspaceRootPath: Scalars['String']['input'];
}>;


export type AddWorkspaceMutation = { __typename?: 'Mutation', addWorkspace: any };

export type SearchCodeEntitiesQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type SearchCodeEntitiesQuery = { __typename?: 'Query', searchCodeEntities: any };

export type GetFileContentQueryVariables = Exact<{
  workspaceRootPath: Scalars['String']['input'];
  filePath: Scalars['String']['input'];
}>;


export type GetFileContentQuery = { __typename?: 'Query', fileContent: string };

export type GetWorkflowConfigQueryVariables = Exact<{
  workspaceRootPath: Scalars['String']['input'];
}>;


export type GetWorkflowConfigQuery = { __typename?: 'Query', workflowConfig: any };

export type StepResponseSubscriptionVariables = Exact<{
  workspaceRootPath: Scalars['String']['input'];
  stepId: Scalars['String']['input'];
}>;


export type StepResponseSubscription = { __typename?: 'Subscription', stepResponse: string };


export const SendStepRequirementDocument = gql`
    mutation SendStepRequirement($workspaceRootPath: String!, $stepId: String!, $contextFilePaths: [String!]!, $requirement: String!, $llmModel: LLMModel) {
  sendStepRequirement(
    workspaceRootPath: $workspaceRootPath
    stepId: $stepId
    contextFilePaths: $contextFilePaths
    requirement: $requirement
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
 *     workspaceRootPath: // value for 'workspaceRootPath'
 *     stepId: // value for 'stepId'
 *     contextFilePaths: // value for 'contextFilePaths'
 *     requirement: // value for 'requirement'
 *     llmModel: // value for 'llmModel'
 *   },
 * });
 */
export function useSendStepRequirementMutation(options: VueApolloComposable.UseMutationOptions<SendStepRequirementMutation, SendStepRequirementMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<SendStepRequirementMutation, SendStepRequirementMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<SendStepRequirementMutation, SendStepRequirementMutationVariables>(SendStepRequirementDocument, options);
}
export type SendStepRequirementMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<SendStepRequirementMutation, SendStepRequirementMutationVariables>;
export const ConfigureStepLlmDocument = gql`
    mutation configureStepLLM($workspaceRootPath: String!, $stepId: String!, $llmModel: LLMModel!) {
  configureStepLlm(
    workspaceRootPath: $workspaceRootPath
    stepId: $stepId
    llmModel: $llmModel
  )
}
    `;

/**
 * __useConfigureStepLlmMutation__
 *
 * To run a mutation, you first call `useConfigureStepLlmMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useConfigureStepLlmMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useConfigureStepLlmMutation({
 *   variables: {
 *     workspaceRootPath: // value for 'workspaceRootPath'
 *     stepId: // value for 'stepId'
 *     llmModel: // value for 'llmModel'
 *   },
 * });
 */
export function useConfigureStepLlmMutation(options: VueApolloComposable.UseMutationOptions<ConfigureStepLlmMutation, ConfigureStepLlmMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<ConfigureStepLlmMutation, ConfigureStepLlmMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<ConfigureStepLlmMutation, ConfigureStepLlmMutationVariables>(ConfigureStepLlmDocument, options);
}
export type ConfigureStepLlmMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<ConfigureStepLlmMutation, ConfigureStepLlmMutationVariables>;
export const AddWorkspaceDocument = gql`
    mutation AddWorkspace($workspaceRootPath: String!) {
  addWorkspace(workspaceRootPath: $workspaceRootPath)
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
export const GetFileContentDocument = gql`
    query GetFileContent($workspaceRootPath: String!, $filePath: String!) {
  fileContent(workspaceRootPath: $workspaceRootPath, filePath: $filePath)
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
 *   workspaceRootPath: // value for 'workspaceRootPath'
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
export const GetWorkflowConfigDocument = gql`
    query GetWorkflowConfig($workspaceRootPath: String!) {
  workflowConfig(workspaceRootPath: $workspaceRootPath)
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
 *   workspaceRootPath: // value for 'workspaceRootPath'
 * });
 */
export function useGetWorkflowConfigQuery(variables: GetWorkflowConfigQueryVariables | VueCompositionApi.Ref<GetWorkflowConfigQueryVariables> | ReactiveFunction<GetWorkflowConfigQueryVariables>, options: VueApolloComposable.UseQueryOptions<GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables>(GetWorkflowConfigDocument, variables, options);
}
export function useGetWorkflowConfigLazyQuery(variables?: GetWorkflowConfigQueryVariables | VueCompositionApi.Ref<GetWorkflowConfigQueryVariables> | ReactiveFunction<GetWorkflowConfigQueryVariables>, options: VueApolloComposable.UseQueryOptions<GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables>(GetWorkflowConfigDocument, variables, options);
}
export type GetWorkflowConfigQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables>;
export const StepResponseDocument = gql`
    subscription StepResponse($workspaceRootPath: String!, $stepId: String!) {
  stepResponse(workspaceRootPath: $workspaceRootPath, stepId: $stepId)
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
 *   workspaceRootPath: // value for 'workspaceRootPath'
 *   stepId: // value for 'stepId'
 * });
 */
export function useStepResponseSubscription(variables: StepResponseSubscriptionVariables | VueCompositionApi.Ref<StepResponseSubscriptionVariables> | ReactiveFunction<StepResponseSubscriptionVariables>, options: VueApolloComposable.UseSubscriptionOptions<StepResponseSubscription, StepResponseSubscriptionVariables> | VueCompositionApi.Ref<VueApolloComposable.UseSubscriptionOptions<StepResponseSubscription, StepResponseSubscriptionVariables>> | ReactiveFunction<VueApolloComposable.UseSubscriptionOptions<StepResponseSubscription, StepResponseSubscriptionVariables>> = {}) {
  return VueApolloComposable.useSubscription<StepResponseSubscription, StepResponseSubscriptionVariables>(StepResponseDocument, variables, options);
}
export type StepResponseSubscriptionCompositionFunctionResult = VueApolloComposable.UseSubscriptionReturn<StepResponseSubscription, StepResponseSubscriptionVariables>;