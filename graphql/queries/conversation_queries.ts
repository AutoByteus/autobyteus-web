import { gql } from 'graphql-tag'

export const GET_AGENT_CONVERSATION_HISTORY = gql`
  query GetAgentConversationHistory(
    $agentDefinitionId: String!
    $page: Int
    $pageSize: Int
    $searchQuery: String
  ) {
    getAgentConversationHistory(
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
        agentName
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

export const GET_RAW_CONVERSATION_HISTORY = gql`
  query GetRawConversationHistory(
    $page: Int
    $pageSize: Int
    $searchQuery: String
    $agentDefinitionId: String
  ) {
    getRawConversationHistory(
      page: $page
      pageSize: $pageSize
      searchQuery: $searchQuery
      agentDefinitionId: $agentDefinitionId
    ) {
      __typename
      conversations {
        __typename
        agentId
        agentDefinitionId
        agentName
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
