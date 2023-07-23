export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  JSON: any;
};

export type Mutation = {
  __typename?: 'Mutation';
  addWorkspace: Scalars['JSON'];
  startWorkflow: Scalars['Boolean'];
};


export type MutationAddWorkspaceArgs = {
  workspaceRootPath: Scalars['String'];
};


export type MutationStartWorkflowArgs = {
  workspaceRootPath: Scalars['String'];
};

export type Query = {
  __typename?: 'Query';
  searchCodeEntities: Scalars['JSON'];
  workflowConfig: Scalars['JSON'];
};


export type QuerySearchCodeEntitiesArgs = {
  query: Scalars['String'];
};


export type QueryWorkflowConfigArgs = {
  workspaceRootPath: Scalars['String'];
};

export type GetWorkflowConfigQueryVariables = Exact<{
  workspaceRootPath: Scalars['String'];
}>;


export type GetWorkflowConfigQuery = { __typename?: 'Query', workflowConfig: any };

export type AddWorkspaceMutationVariables = Exact<{
  workspaceRootPath: Scalars['String'];
}>;


export type AddWorkspaceMutation = { __typename?: 'Mutation', addWorkspace: any };

export type SearchCodeEntitiesQueryVariables = Exact<{
  query: Scalars['String'];
}>;


export type SearchCodeEntitiesQuery = { __typename?: 'Query', searchCodeEntities: any };
