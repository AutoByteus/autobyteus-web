import gql from 'graphql-tag';

export const GET_CONVERSATION_HISTORY = gql`
  query GetConversationHistory($stepName: String!, $page: Int!, $pageSize: Int!) {
    getConversationHistory(stepName: $stepName, page: $page, pageSize: $pageSize) {
      conversations {
        stepConversationId
        stepName
        createdAt
        totalCost  # Added totalCost field
        messages {
          messageId
          role
          message
          timestamp
          contextPaths
          originalMessage
        }
      }
      totalConversations
      totalPages
      currentPage
    }
  }
`;

export const GET_COST_SUMMARY = gql`
  query GetCostSummary($stepName: String, $timeFrame: String!) {
    getCostSummary(stepName: $stepName, timeFrame: $timeFrame)
  }
`;