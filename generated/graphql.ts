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
  Claude_3Haiku = 'CLAUDE_3_HAIKU',
  Claude_3Opus = 'CLAUDE_3_OPUS',
  Gemini_1_0Pro = 'GEMINI_1_0_PRO',
  Gemini_1_5Flash = 'GEMINI_1_5_FLASH',
  Gemini_1_5Pro = 'GEMINI_1_5_PRO',
  Gemini_1_5ProExperimental = 'GEMINI_1_5_PRO_EXPERIMENTAL',
  Gemma_2_2B = 'GEMMA_2_2B',
  Gemma_2_9B = 'GEMMA_2_9B',
  Gemma_2_9BIt = 'GEMMA_2_9B_IT',
  Gemma_2_27B = 'GEMMA_2_27B',
  Gemma_2_27BIt = 'GEMMA_2_27B_IT',
  Gemma_7BIt = 'GEMMA_7B_IT',
  Gpt_3_5Turbo = 'GPT_3_5_TURBO',
  Gpt_4 = 'GPT_4',
  Llama3_8B_8192 = 'LLAMA3_8B_8192',
  Llama3_70B_8192 = 'LLAMA3_70B_8192',
  Llama_3_1_8BInstant = 'LLAMA_3_1_8B_INSTANT',
  Llama_3_1_8BInstruct = 'LLAMA_3_1_8B_INSTRUCT',
  Llama_3_1_70BInstruct = 'LLAMA_3_1_70B_INSTRUCT',
  Llama_3_1_70BVersatile = 'LLAMA_3_1_70B_VERSATILE',
  Llama_3_1_405BReasoning = 'LLAMA_3_1_405B_REASONING',
  Llama_3_1SonarLarge_128KChat = 'LLAMA_3_1_SONAR_LARGE_128K_CHAT',
  Llama_3_1SonarLarge_128KOnline = 'LLAMA_3_1_SONAR_LARGE_128K_ONLINE',
  Llama_3_1SonarSmall_128KChat = 'LLAMA_3_1_SONAR_SMALL_128K_CHAT',
  Llama_3_1SonarSmall_128KOnline = 'LLAMA_3_1_SONAR_SMALL_128K_ONLINE',
  MistralLarge = 'MISTRAL_LARGE',
  MistralMedium = 'MISTRAL_MEDIUM',
  MistralSmall = 'MISTRAL_SMALL',
  Mixtral_8X7B_32768 = 'MIXTRAL_8X7B_32768',
  Mixtral_8X7BInstruct = 'MIXTRAL_8X7B_INSTRUCT',
  Nemotron_4_340BInstruct = 'NEMOTRON_4_340B_INSTRUCT'
}

export type Mutation = {
  __typename?: 'Mutation';
  addWorkspace: Scalars['JSON']['output'];
  sendImplementationRequirement: Scalars['String']['output'];
  startWorkflow: Scalars['Boolean']['output'];
};


export type MutationAddWorkspaceArgs = {
  workspaceRootPath: Scalars['String']['input'];
};


export type MutationSendImplementationRequirementArgs = {
  contextFilePaths: Array<Scalars['String']['input']>;
  implementationRequirement: Scalars['String']['input'];
  llmModel?: InputMaybe<LlmModel>;
  stepId: Scalars['String']['input'];
  workspaceRootPath: Scalars['String']['input'];
};


export type MutationStartWorkflowArgs = {
  workspaceRootPath: Scalars['String']['input'];
};

export type Query = {
  __typename?: 'Query';
  getAvailableWorkspaceTools: Array<WorkspaceTool>;
  searchCodeEntities: Scalars['JSON']['output'];
  workflowConfig: Scalars['JSON']['output'];
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
  implementationResponse: Scalars['String']['output'];
};


export type SubscriptionImplementationResponseArgs = {
  stepId: Scalars['String']['input'];
  workspaceRootPath: Scalars['String']['input'];
};

export type WorkspaceTool = {
  __typename?: 'WorkspaceTool';
  name: Scalars['String']['output'];
  promptTemplate: Scalars['String']['output'];
};

export type SendImplementationRequirementMutationVariables = Exact<{
  workspaceRootPath: Scalars['String']['input'];
  stepId: Scalars['String']['input'];
  contextFilePaths: Array<Scalars['String']['input']> | Scalars['String']['input'];
  implementationRequirement: Scalars['String']['input'];
  llmModel?: InputMaybe<LlmModel>;
}>;


export type SendImplementationRequirementMutation = { __typename?: 'Mutation', sendImplementationRequirement: string };

export type SearchCodeEntitiesQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type SearchCodeEntitiesQuery = { __typename?: 'Query', searchCodeEntities: any };

export type GetWorkflowConfigQueryVariables = Exact<{
  workspaceRootPath: Scalars['String']['input'];
}>;


export type GetWorkflowConfigQuery = { __typename?: 'Query', workflowConfig: any };

export type AddWorkspaceMutationVariables = Exact<{
  workspaceRootPath: Scalars['String']['input'];
}>;


export type AddWorkspaceMutation = { __typename?: 'Mutation', addWorkspace: any };

export type ImplementationResponseSubscriptionVariables = Exact<{
  workspaceRootPath: Scalars['String']['input'];
  stepId: Scalars['String']['input'];
}>;


export type ImplementationResponseSubscription = { __typename?: 'Subscription', implementationResponse: string };


export const SendImplementationRequirementDocument = gql`
    mutation SendImplementationRequirement($workspaceRootPath: String!, $stepId: String!, $contextFilePaths: [String!]!, $implementationRequirement: String!, $llmModel: LLMModel) {
  sendImplementationRequirement(
    workspaceRootPath: $workspaceRootPath
    stepId: $stepId
    contextFilePaths: $contextFilePaths
    implementationRequirement: $implementationRequirement
    llmModel: $llmModel
  )
}
    `;

/**
 * __useSendImplementationRequirementMutation__
 *
 * To run a mutation, you first call `useSendImplementationRequirementMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useSendImplementationRequirementMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useSendImplementationRequirementMutation({
 *   variables: {
 *     workspaceRootPath: // value for 'workspaceRootPath'
 *     stepId: // value for 'stepId'
 *     contextFilePaths: // value for 'contextFilePaths'
 *     implementationRequirement: // value for 'implementationRequirement'
 *     llmModel: // value for 'llmModel'
 *   },
 * });
 */
export function useSendImplementationRequirementMutation(options: VueApolloComposable.UseMutationOptions<SendImplementationRequirementMutation, SendImplementationRequirementMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<SendImplementationRequirementMutation, SendImplementationRequirementMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<SendImplementationRequirementMutation, SendImplementationRequirementMutationVariables>(SendImplementationRequirementDocument, options);
}
export type SendImplementationRequirementMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<SendImplementationRequirementMutation, SendImplementationRequirementMutationVariables>;
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
export const ImplementationResponseDocument = gql`
    subscription ImplementationResponse($workspaceRootPath: String!, $stepId: String!) {
  implementationResponse(workspaceRootPath: $workspaceRootPath, stepId: $stepId)
}
    `;

/**
 * __useImplementationResponseSubscription__
 *
 * To run a query within a Vue component, call `useImplementationResponseSubscription` and pass it any options that fit your needs.
 * When your component renders, `useImplementationResponseSubscription` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the subscription
 * @param options that will be passed into the subscription, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/subscription.html#options;
 *
 * @example
 * const { result, loading, error } = useImplementationResponseSubscription({
 *   workspaceRootPath: // value for 'workspaceRootPath'
 *   stepId: // value for 'stepId'
 * });
 */
export function useImplementationResponseSubscription(variables: ImplementationResponseSubscriptionVariables | VueCompositionApi.Ref<ImplementationResponseSubscriptionVariables> | ReactiveFunction<ImplementationResponseSubscriptionVariables>, options: VueApolloComposable.UseSubscriptionOptions<ImplementationResponseSubscription, ImplementationResponseSubscriptionVariables> | VueCompositionApi.Ref<VueApolloComposable.UseSubscriptionOptions<ImplementationResponseSubscription, ImplementationResponseSubscriptionVariables>> | ReactiveFunction<VueApolloComposable.UseSubscriptionOptions<ImplementationResponseSubscription, ImplementationResponseSubscriptionVariables>> = {}) {
  return VueApolloComposable.useSubscription<ImplementationResponseSubscription, ImplementationResponseSubscriptionVariables>(ImplementationResponseDocument, variables, options);
}
export type ImplementationResponseSubscriptionCompositionFunctionResult = VueApolloComposable.UseSubscriptionReturn<ImplementationResponseSubscription, ImplementationResponseSubscriptionVariables>;