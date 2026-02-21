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

export const ListTeamRunHistory = gql`
  query ListTeamRunHistory {
    listTeamRunHistory {
      teamId
      teamDefinitionId
      teamDefinitionName
      workspaceRootPath
      summary
      lastActivityAt
      lastKnownStatus
      deleteLifecycle
      isActive
      members {
        memberRouteKey
        memberName
        memberAgentId
        workspaceRootPath
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

export const GetTeamRunResumeConfig = gql`
  query GetTeamRunResumeConfig($teamId: String!) {
    getTeamRunResumeConfig(teamId: $teamId) {
      teamId
      isActive
      manifest
    }
  }
`;

export const GetTeamMemberRunProjection = gql`
  query GetTeamMemberRunProjection($teamId: String!, $memberRouteKey: String!) {
    getTeamMemberRunProjection(teamId: $teamId, memberRouteKey: $memberRouteKey) {
      agentId
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
