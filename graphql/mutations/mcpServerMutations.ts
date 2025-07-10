import { gql } from 'graphql-tag'

export const CONFIGURE_MCP_SERVER = gql`
  mutation ConfigureMcpServer($input: McpServerInput!) {
    configureMcpServer(input: $input) {
      savedConfig {
        ... on StdioMcpServerConfig {
          serverId
          transportType
          enabled
          toolNamePrefix
          command
          args
          env
          cwd
        }
        ... on SseMcpServerConfig {
          serverId
          transportType
          enabled
          toolNamePrefix
          url
          token
          headers
        }
        ... on StreamableHttpMcpServerConfig {
          serverId
          transportType
          enabled
          toolNamePrefix
          url
          token
          headers
        }
      }
    }
  }
`

export const DELETE_MCP_SERVER = gql`
  mutation DeleteMcpServer($serverId: String!) {
    deleteMcpServer(serverId: $serverId) {
      success
      message
    }
  }
`
