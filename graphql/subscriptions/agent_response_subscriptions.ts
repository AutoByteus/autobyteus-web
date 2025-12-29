import { gql } from 'graphql-tag'

export const AgentResponseSubscription = gql`
  subscription AgentResponse($agentId: String!) {
    agentResponse(agentId: $agentId) {
      eventId
      timestamp
      eventType
      agentId
      data {
        __typename
        ... on GraphQLAssistantChunkData {
          content
          reasoning
          isComplete
          usage {
            promptTokens
            completionTokens
            totalTokens
            promptCost
            completionCost
            totalCost
          }
          imageUrls
          audioUrls
          videoUrls
        }
        ... on GraphQLAssistantCompleteResponseData {
          content
          reasoning
          usage {
            promptTokens
            completionTokens
            totalTokens
            promptCost
            completionCost
            totalCost
          }
          imageUrls
          audioUrls
          videoUrls
        }
        ... on GraphQLToolInteractionLogEntryData {
          logEntry
          toolInvocationId
          toolName
        }
        ... on GraphQLAgentStatusUpdateData {
          newStatus
          oldStatus
          trigger
          toolName
          errorMessage
          errorDetails
        }
        ... on GraphQLErrorEventData {
          source
          message
          details
        }
        ... on GraphQLToolInvocationApprovalRequestedData {
          invocationId
          toolName
          arguments
        }
        ... on GraphQLToolInvocationAutoExecutingData {
          invocationId
          toolName
          arguments
        }
        ... on GraphQLSystemTaskNotificationData {
          senderId
          content
        }
        ... on GraphQLInterAgentMessageData {
          senderAgentId
          recipientRoleName
          messageType
          content
        }
        ... on GraphQLToDoListUpdateData {
          todos {
            description
            todoId
            status
          }
        }
      }
    }
  }
`
