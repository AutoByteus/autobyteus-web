AutoByteus


Your AI-Coding Agent: Our vision is to utilize LLM, like GPT4, to generate the entire codebase seamlessly.

To achieve this, we need to construct efficient prompts and a logical workflow that facilitates effective communication with LLM. Additionally, automating the refinement of user requirements based on automated code context building is crucial.

Only when each step is meticulously fine-tuned and functions seamlessly, can we unlock the true potential of software development by LLM.

This holds true even for individuals with minimal or no coding knowledge.


Installation

To debug Vitest, we have to install <https://marketplace.visualstudio.com/items?itemName=ZixuanChen.vitest-explorer> in vscode.


# **Run Test From CommandLine**

## Run a specific test

yarn vitest src/components/workflow/__tests__/WorkflowStepDetails.spec.ts --testNamePattern "shows Search Code Context button if allow_code_context_building is true"


## Run all tests from file

yarn test src/components/workflow/__tests__/WorkflowStepDetails.spec.ts


