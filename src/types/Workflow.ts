export enum Source {
  DYNAMIC = "DYNAMIC",
  USER_INPUT = "USER_INPUT"
}


export interface PromptTemplateVariable {
  name: string;
  source: Source;
  allow_code_context_building: boolean;
  allow_llm_refinement: boolean;
}

export interface PromptTemplate {
  template: string;
  variables: PromptTemplateVariable[];
}

export interface Step {
  id: string;             
  name: string;           
  prompt_template: PromptTemplate;  
}

export interface Workflow {
  name: string;           
  steps: Record<string, Step>;  
}
