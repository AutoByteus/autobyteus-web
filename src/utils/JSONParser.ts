import { Workflow } from '../types/Workflow';

export const deserializeWorkflow = (jsonString: string): Workflow => {
  return JSON.parse(jsonString) as Workflow;
}

import { SearchResult } from '../types/code_entities';

export const deserializeSearchResult = (jsonString: string): SearchResult => {
  return JSON.parse(jsonString) as SearchResult;
}

