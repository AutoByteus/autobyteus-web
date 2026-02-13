import { gql } from 'graphql-tag';

export const ListRunHistory = gql`
  query ListRunHistory($limitPerAgent: Int = 6) {
    listRunHistory(limitPerAgent: $limitPerAgent) {
      workspaceRootPath
      workspaceName
      agents {
        agentDefinitionId
        agentName
        runs {
          runId
          summary
          lastActivityAt
          lastKnownStatus
          isActive
        }
      }
    }
  }
`;

export const GetRunProjection = gql`
  query GetRunProjection($runId: String!) {
    getRunProjection(runId: $runId) {
      runId
      summary
      lastActivityAt
      conversation
    }
  }
`;

export const GetRunResumeConfig = gql`
  query GetRunResumeConfig($runId: String!) {
    getRunResumeConfig(runId: $runId) {
      runId
      isActive
      manifestConfig {
        agentDefinitionId
        workspaceRootPath
        llmModelIdentifier
        llmConfig
        autoExecuteTools
        skillAccessMode
      }
      editableFields {
        llmModelIdentifier
        llmConfig
        autoExecuteTools
        skillAccessMode
        workspaceRootPath
      }
    }
  }
`;
