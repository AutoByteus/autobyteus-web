<template>
  <!-- Slide-down Panel for Selected Step Details -->
  <transition name="slide-fade">
    <div v-if="selectedStep" class="selected-step-details">
      <h3>Selected Step: {{ selectedStep.name }}</h3>
      
      <!-- Prompt Editor Integration -->
      <div v-if="selectedStep.prompt_template" class="prompt-editor-section">
        <h4>Edit Prompt:</h4>
        <PromptEditor :template="selectedStep.prompt_template" />
        
        <!-- Show Search Code Context button based on allow_code_context_building -->
        <button v-if="showSearchContextButton" @click="searchCodeContext" class="search-context-button">Search Code Context</button>
        
        <!-- Show Refine Requirement button based on allow_llm_refinement -->
        <button v-if="showRefineRequirementButton" class="refine-requirement-button">Refine Requirement</button>
      </div>

      <!-- Search Results Section -->
      <div class="search-results-section">
        <h4>Search Results:</h4>
        <CodeSearchResult v-for="result in searchResults" :key="result.entity.file_path" :snippet="result.entity.docstring" />
      </div>

      <button @click="startExecution" class="start-execution-button">Start Execution</button>
      <p>Execution Status: {{ executionStatus }}</p>
      
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
import { useQuery } from "@vue/apollo-composable";
import { SearchCodeEntities } from "../../graphql/queries";

// Importing the required types and functions
import type { Step } from '../../types/Workflow';
import type { SearchResult, ScoredEntity, CodeEntity } from '../../types/code_entities';
import { deserializeSearchResult } from '../../utils/JSONParser';

const selectedStep = inject<Ref<Step | null>>('selectedStep')!;
const executionStatus = ref('Not Started');
const executionLogs = ref('');
const searchResults = ref<ScoredEntity<CodeEntity>[]>([]);

const { result: searchResult, loading: searchLoading, error: searchError } = useQuery(
  SearchCodeEntities, 
  { query: "dummy_query" }  // This is the dummy query for now
);

const searchCodeContext = () => {
  if (searchResult.value) {
    const parsedSearchResult: SearchResult = deserializeSearchResult(searchResult.value);
    searchResults.value = parsedSearchResult.entities;
  }
  if (searchError.value) {
    console.error("Error while searching for code entities:", searchError.value);
  }
};

const startExecution = () => {
  executionStatus.value = 'Running';
  // ... start execution process
  // ... update executionLogs with streaming logs from the backend
};

// Computed property to determine if the Search Code Context button should be displayed
const showSearchContextButton = computed(() => {
  return selectedStep.value?.prompt_template.variables.some(variable => variable.allow_code_context_building);
});

// Computed property to determine if the Refine Requirement button should be displayed
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