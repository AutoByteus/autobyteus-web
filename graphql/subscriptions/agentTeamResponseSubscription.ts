import { gql } from 'graphql-tag';

// This is a fragment that helps in recursively defining the subscription
const nestedTeamEventFragment = gql`
  fragment NestedTeamEvent on GraphQLAgentTeamStreamEvent {
    eventId
    timestamp
    teamId
    eventSourceType
    data {
      __typename
      ... on GraphQLAgentTeamPhaseTransitionData {
        newPhase
        oldPhase
        errorMessage
      }
      ... on GraphQLAgentEventRebroadcastPayload {
        agentName
        agentEvent {
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
            }
            ... on GraphQLToolInteractionLogEntryData {
              logEntry
              toolInvocationId
              toolName
            }
            ... on GraphQLAgentOperationalPhaseTransitionData {
              newPhase
              oldPhase
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
          }
        }
      }
      ... on GraphQLTaskPlanPublishedEvent {
        teamId
        planId
        plan {
          planId
          overallGoal
          tasks {
            taskId
            taskName
            assigneeName
            description
            dependencies
          }
        }
      }
      ... on GraphQLTaskStatusUpdatedEvent {
        teamId
        planId
        taskId
        newStatus
        agentName
      }
    }
  }
`;

export const AgentTeamResponseSubscription = gql`
  subscription AgentTeamResponse($teamId: String!) {
    agentTeamResponse(teamId: $teamId) {
      ...NestedTeamEvent
      data {
        ... on GraphQLSubTeamEventRebroadcastPayload {
          subTeamNodeName
          subTeamEvent {
            ...NestedTeamEvent
            data {
              ... on GraphQLSubTeamEventRebroadcastPayload {
                subTeamNodeName
                subTeamEvent {
                  ...NestedTeamEvent
                  # Add more levels if deeper nesting is possible
                }
              }
            }
          }
        }
      }
    }
  }
  ${nestedTeamEventFragment}
`;
