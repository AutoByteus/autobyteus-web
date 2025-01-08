
import gql from 'graphql-tag';

export const GET_CONVERSATION_HISTORY = gql`
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
