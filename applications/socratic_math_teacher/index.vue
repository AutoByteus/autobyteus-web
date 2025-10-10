<template>
  <div class="w-full h-full grid grid-cols-1 md:grid-cols-2">
    <!-- Left Panel: User Input -->
    <ProblemInput
      :is-loading="store.isLoading"
      @submit="handleSubmit"
    />

    <!-- Right Panel: Solution and Animation Output -->
    <SolutionDisplay
      :is-loading="store.isLoading"
      :error="store.error"
      :solution-text="store.solutionText"
      :animation-url="store.animationUrl"
      @reset="handleReset"
    />
  </div>
</template>

<script setup lang="ts">
import { useSocraticMathTeacherStore } from './store';
import ProblemInput from './components/ProblemInput.vue';
import SolutionDisplay from './components/SolutionDisplay.vue';
import type { ContextFilePath } from '~/types/conversation';

const store = useSocraticMathTeacherStore();

interface SubmitPayload {
  problemText: string;
  contextFiles: ContextFilePath[];
}

function handleSubmit(payload: SubmitPayload) {
  store.solveAndAnimate(payload.problemText, payload.contextFiles);
}

function handleReset() {
    store.reset();
    // Potentially we could also clear the input form here, but for now,
    // let's leave it to allow users to iterate on their previous problem.
}
</script>
