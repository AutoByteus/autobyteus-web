export interface Step {
    id: string;             // The unique identifier for a step.
    name: string;           // The display name for a step.
    prompt_template: string;
    // You can expand on this, for example, adding description, status, etc.
  }
  
  export interface Workflow {
    name: string;           // Name of the entire workflow.
    steps: Record<string, Step>;  // Steps of the workflow, indexed by step id.
}




  