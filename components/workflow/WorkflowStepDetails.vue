<template>
  <transition name="slide-fade">
    <div v-if="selectedStep" class="selected-step-details">
      <h3>Selected Step: {{ selectedStep.name }}</h3>
      
      <div v-if="selectedStep.prompt_template" class="prompt-editor-section">
        <h4>Edit Prompt:</h4>
        <PromptEditor 
          :template="selectedStep.prompt_template" 
          @update:variable="updatePromptVariable"
        />
        
        <button v-if="showSearchContextButton" @click="searchCodeContext" class="search-context-button">Search Code Context</button>
        
        <button v-if="showRefineRequirementButton" class="refine-requirement-button">Refine Requirement</button>
      </div>

      <div class="search-results-section">
        <h4>Search Results:</h4>
        <CodeSearchResult v-for="code_entity in processedSearchData" :key="code_entity.entity.file_path" :snippet="code_entity.entity.docstring" />
      </div>

      <button @click="startExecution" class="start-execution-button">Start Execution</button>
      <p data-test-id="execution-status">Execution Status: {{ executionStatus }}</p>
      
      <ExecutionLogsPanel :logs="executionLogs" />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWorkflowStore } from '~/stores/workflow'
import { useLazyQuery } from '@vue/apollo-composable'
import { SearchCodeEntities } from '~/graphql/queries/code_search_queries'
import type { SearchCodeEntitiesQuery, SearchCodeEntitiesQueryVariables } from '~/generated/graphql'
import type { ScoredEntity, CodeEntity } from '~/types/code_entities'
import { deserializeSearchResult } from '~/utils/JSONParser'

const workflowStore = useWorkflowStore()

const executionStatus = ref('Not Started')
const executionLogs = ref('')
const processedSearchData = ref<ScoredEntity<CodeEntity>[]>([])
const promptVariables = ref<{ [key: string]: string }>({})

const selectedStep = computed(() => {
  const workflow = workflowStore.workflow
  const selectedStepId = workflowStore.selectedStepId
  return workflow && selectedStepId ? workflow.steps[selectedStepId] : null
})

const { load: executeSearch, onResult: onSearchResult } = useLazyQuery<SearchCodeEntitiesQuery, SearchCodeEntitiesQueryVariables>(SearchCodeEntities)

onSearchResult(({ data }) => {
  if (data?.searchCodeEntities) {
    const parsedSearchResult = deserializeSearchResult(data.searchCodeEntities)
    processedSearchData.value = parsedSearchResult.entities
  }
})

const updatePromptVariable = ({ variableName, value }: { variableName: string, value: string }) => {
  promptVariables.value[variableName] = value
}

const searchCodeContext = () => {
  const variableToSearch = Object.keys(promptVariables.value).find(variableName => {
    const variable = selectedStep.value?.prompt_template.variables.find(v => v.name === variableName)
    return variable?.allow_code_context_building
  })

  if (variableToSearch) {
    executeSearch({ query: promptVariables.value[variableToSearch] })
  }
}

const startExecution = () => {
  executionStatus.value = 'Running'
}

const showSearchContextButton = computed(() => {
  return selectedStep.value?.prompt_template.variables.some(variable => variable.allow_code_context_building)
})

const showRefineRequirementButton = computed(() => {
  return selectedStep.value?.prompt_template.variables.some(variable => variable.allow_llm_refinement)
})
</script>

<style scoped>
/* ... (keep existing styles) ... */
</style>