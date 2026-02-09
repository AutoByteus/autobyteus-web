import { gql } from 'graphql-tag'

export const LIST_AGENT_MEMORY_SNAPSHOTS = gql`
  query ListAgentMemorySnapshots($search: String, $page: Int, $pageSize: Int) {
    listAgentMemorySnapshots(search: $search, page: $page, pageSize: $pageSize) {
      total
      page
      pageSize
      totalPages
      entries {
        agentId
        lastUpdatedAt
        hasWorkingContext
        hasEpisodic
        hasSemantic
        hasRawTraces
        hasRawArchive
      }
    }
  }
`
