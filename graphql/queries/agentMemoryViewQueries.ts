import { gql } from 'graphql-tag'

export const GET_AGENT_MEMORY_VIEW = gql`
  query GetAgentMemoryView(
    $agentId: String!
    $includeWorkingContext: Boolean
    $includeEpisodic: Boolean
    $includeSemantic: Boolean
    $includeRawTraces: Boolean
    $includeArchive: Boolean
    $rawTraceLimit: Int
    $conversationLimit: Int
  ) {
    getAgentMemoryView(
      agentId: $agentId
      includeWorkingContext: $includeWorkingContext
      includeEpisodic: $includeEpisodic
      includeSemantic: $includeSemantic
      includeRawTraces: $includeRawTraces
      includeArchive: $includeArchive
      rawTraceLimit: $rawTraceLimit
      conversationLimit: $conversationLimit
      includeConversation: false
    ) {
      agentId
      workingContext {
        role
        content
        reasoning
        toolPayload
        ts
      }
      episodic
      semantic
      rawTraces {
        traceType
        content
        toolName
        toolArgs
        toolResult
        toolError
        media
        turnId
        seq
        ts
      }
    }
  }
`
