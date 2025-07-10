import { gql } from 'graphql-tag'

export const GET_CONVERSATION_HISTORY = gql`
  query GetConversationHistory(
    $agentDefinitionId: String!
    $page: Int
    $pageSize: Int
  ) {
    getConversationHistory(
      agentDefinitionId: $agentDefinitionId
      page: $page
      pageSize: $pageSize
    ) {
      conversations {
        agentId
        agentDefinitionId
        createdAt
        llmModel
        useXmlToolFormat
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
      totalPages
      currentPage
    }
  }
`;
