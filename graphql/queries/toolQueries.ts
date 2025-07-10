import { gql } from 'graphql-tag'

export const GET_TOOLS = gql`
  query GetTools($category: ToolCategoryEnum, $sourceServerId: String) {
    tools(category: $category, sourceServerId: $sourceServerId) {
      name
      description
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
