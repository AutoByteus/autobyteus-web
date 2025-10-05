import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { RunApplication } from '~/graphql/mutations/applicationMutations';

interface RunApplicationResult {
  runApplication: {
    solutionText: string;
    animationUrl: string;
    status: string;
  };
}

export const useGeometrySolverStore = defineStore('geometrySolverApp', () => {
  // --- STATE ---
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const solutionText = ref<string | null>(null);
  const animationUrl = ref<string | null>(null);

  // --- MUTATIONS ---
  const { mutate: runApplicationMutation, loading: mutationLoading } = useMutation<RunApplicationResult>(RunApplication);

  // --- ACTIONS ---
  async function solveAndAnimate(problemText: string) {
    isLoading.value = true;
    error.value = null;
    solutionText.value = null;
    animationUrl.value = null;

    try {
      const result = await runApplicationMutation({
        appId: "geometry-solver",
        input: {
          problem_text: problemText,
          // In the future, we could pass the selected LLM model here
          // llmModelIdentifier: "openai/gpt-4-turbo"
        }
      });

      if (result?.data?.runApplication) {
        const payload = result.data.runApplication;
        if (payload.status === 'success') {
          solutionText.value = payload.solutionText;
          // Add a timestamp to the URL to ensure the iframe reloads fresh content
          animationUrl.value = `${payload.animationUrl}&t=${new Date().getTime()}`;
        } else {
          throw new Error("Application execution failed.");
        }
      } else {
        throw new Error("Invalid response from server.");
      }
    } catch (e: any) {
      console.error("Error running Geometry Solver application:", e);
      error.value = e.message || "An unknown error occurred.";
    } finally {
      isLoading.value = false;
    }
  }

  // --- GETTERS ---
  // (No getters needed for this simple store)

  return {
    isLoading,
    error,
    solutionText,
    animationUrl,
    solveAndAnimate,
  };
});
