import { gql } from 'graphql-tag'

export const GET_TOOLS = gql`
  query GetTools($origin: ToolOriginEnum, $sourceServerId: String) {
    tools(origin: $origin, sourceServerId: $sourceServerId) {
      name
      description
      origin
      category
      argumentSchema {
        parameters {
          name
          paramType
          description
          required
          defaultValue
          enumValues
        }
      }
    }
  }
`

export const GET_TOOLS_GROUPED_BY_CATEGORY = gql`
  query GetToolsGroupedByCategory($origin: ToolOriginEnum!) {
    toolsGroupedByCategory(origin: $origin) {
      categoryName
      tools {
        name
        description
        origin
        category
        argumentSchema {
          parameters {
            name
            paramType
            description
            required
            defaultValue
            enumValues
          }
        }
      }
    }
  }
`
