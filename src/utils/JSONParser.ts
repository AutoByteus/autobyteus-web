import { Workflow } from '../types/Workflow';

export const deserializeWorkflow = (jsonString: string): Workflow => {
  return JSON.parse(jsonString) as Workflow;
}
