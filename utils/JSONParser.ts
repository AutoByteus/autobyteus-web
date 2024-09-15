import type { Workflow } from '~/types/workflow'
import type { SearchResult } from '~/types/code_entities'

export const deserializeWorkflow = (jsonString: string): Workflow => {
  return JSON.parse(jsonString) as Workflow
}

export const deserializeSearchResult = (jsonString: string): SearchResult => {
  return JSON.parse(jsonString) as SearchResult
}