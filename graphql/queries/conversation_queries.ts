import { gql } from 'graphql-tag'

export const GET_CONVERSATION_HISTORY = gql`
  query GetConversationHistory(
    $agentDefinitionId: String!
    $page: Int
    $pageSize: Int
    $searchQuery: String
  ) {
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
