<template>
  <!-- Slide-down Panel for Selected Step Details -->
  <transition name="slide-fade">
    <div v-if="selectedStep" class="selected-step-details">
      <h3>Selected Step: {{ selectedStep.name }}</h3>
      
      <!-- Prompt Editor Integration -->
      <div v-if="selectedStep.prompt_template" class="prompt-editor-section">
        <h4>Edit Prompt:</h4>
        <PromptEditor 
            :template="selectedStep.prompt_template" 
            @update:variable="updatePromptVariable"
        />
        
        <!-- Show Search Code Context button based on allow_code_context_building -->
        <button v-if="showSearchContextButton" @click="searchCodeContext" class="search-context-button">Search Code Context</button>
        
        <!-- Show Refine Requirement button based on allow_llm_refinement -->
        <button v-if="showRefineRequirementButton" class="refine-requirement-button">Refine Requirement</button>
      </div>

      <!-- Search Results Section -->
      <div class="search-results-section">
        <h4>Search Results:</h4>
        <CodeSearchResult v-for="code_entity in processedSearchData" :key="code_entity.entity.file_path" :snippet="code_entity.entity.docstring" />
      </div>

      <button @click="startExecution" class="start-execution-button">Start Execution</button>
      <p data-test-id="execution-status">Execution Status: {{ executionStatus }}</p>
      
      <!-- Integration of the ExecutionLogsPanel component -->
      <ExecutionLogsPanel :logs="executionLogs" />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { inject, Ref, ref, computed } from 'vue';
import PromptEditor from '../prompt/PromptEditor.vue';
import CodeSearchResult from './CodeSearchResult.vue';
import ExecutionLogsPanel from './ExecutionLogsPanel.vue';
import { useLazyQuery } from "@vue/apollo-composable";
import { SearchCodeEntities } from "../../graphql/queries";
import type { SearchCodeEntitiesQuery as SearchCodeEntitiesQueryType, SearchCodeEntitiesQueryVariables }  from "../../generated/graphql";
import type { SearchResult, ScoredEntity, CodeEntity } from '../../types/code_entities';
import { deserializeSearchResult } from '../../utils/JSONParser';
import { Step } from '../../types/Workflow';

const selectedStep = inject<Ref<Step | null>>('selectedStep')!;
const executionStatus = ref('Not Started');

const executionLogs = ref('');
const processedSearchData = ref<ScoredEntity<CodeEntity>[]>([]);
const searchCodeQueryVariables: Ref<SearchCodeEntitiesQueryVariables> = ref({ query: "" });

const { load: executeSearch, onResult: onSearchResult } = useLazyQuery<SearchCodeEntitiesQueryType, SearchCodeEntitiesQueryVariables>(SearchCodeEntities, searchCodeQueryVariables);

onSearchResult(({ data }) => {
  const parsedSearchResult: SearchResult = deserializeSearchResult(data.searchCodeEntities);
  processedSearchData.value = parsedSearchResult.entities;
});

const promptVariables = ref<{ [key: string]: string }>({});

const updatePromptVariable = ({ variableName, value }: { variableName: string, value: string }) => {
  promptVariables.value[variableName] = value;
};

const searchCodeContext = () => {
  // Check if any of the updated variables support code search
  const variableToSearch = Object.keys(promptVariables.value).find(variableName => {
    const variable = selectedStep.value?.prompt_template.variables.find(v => v.name === variableName);
    return variable?.allow_code_context_building;
  });

  if (variableToSearch) {
    searchCodeQueryVariables.value.query = promptVariables.value[variableToSearch];
    executeSearch(SearchCodeEntities);
  }
};


const startExecution = () => {
  executionStatus.value = 'Running';
};

const showSearchContextButton = computed(() => {
  return selectedStep.value?.prompt_template.variables.some(variable => variable.allow_code_context_building);
});

const showRefineRequirementButton = computed(() => {
  return selectedStep.value?.prompt_template.variables.some(variable => variable.allow_llm_refinement);
});
</script>

<style scoped>
.selected-step-details {
  width: 100%;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background-color: #f5f5f5;
}

.slide-fade-enter-active, .slide-fade-leave-active {
  transition: opacity 0.5s, max-height 0.5s, padding 0.5s;
}

.slide-fade-enter, .slide-fade-leave-to {
  opacity: 0;
  max-height: 0;
  padding: 0;
}

h3, h4 {
  color: #333;
  margin-bottom: 15px;
}

.prompt-editor-section {
  width: 100%;
  margin-top: 15px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.start-execution-button {
  margin-top: 20px;
  padding: 10px 15px;
  color: #fff;
  background-color: #428BCA;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.start-execution-button:hover {
  background-color: #3276B1;
}

 /* Refine Requirement Button */
 .refine-requirement-button {
        padding: 10px 15px;
        color: #fff;
        background-color: #FFA500;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s;
        margin-left: 10px;
        margin-top: 10px;
    }

    .refine-requirement-button:hover {
        background-color: #FF8C00;
    }

    /* Search Results Section */
    .search-results-section {
        width: 100%;
        margin-top: 20px;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 5px;
        background-color: #e6f0ff;
        overflow-y: auto;
        max-height: 200px;
    }

    /* Individual Search Result */
    .search-result {
        padding: 10px;
        border-bottom: 1px solid #ccc;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .search-result:last-child {
        border-bottom: none;
    }

    .search-result:hover {
        background-color: #d4e4ff;
    }

    /* Search Context and Start Execution Buttons */
    .search-context-button, .start-execution-button {
        padding: 10px 15px;
        color: #fff;
        background-color: #428BCA;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s;
        margin-top: 10px;
    }

    .search-context-button:hover, .start-execution-button:hover {
        background-color: #3276B1;
    }
</style>