<template>
  <div class="w-full h-full">
    <div v-if="loading" class="flex items-center justify-center h-full">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-lg text-gray-600">Loading Application...</p>
      </div>
    </div>
    <div v-else-if="error" class="p-8">
      <h2 class="text-2xl font-bold text-red-600">Error</h2>
      <p class="text-gray-700 mt-2">Could not load the application '{{ appId }}'.</p>
      <p class="text-gray-500 mt-1">Please check if the application is correctly configured and try again.</p>
      <NuxtLink to="/applications" class="mt-4 inline-block text-blue-600 hover:underline">
        &larr; Back to Applications
      </NuxtLink>
    </div>
    <div v-else-if="appComponent" class="w-full h-full">
      <component :is="appComponent" />
    </div>
    <div v-else class="p-8">
       <h2 class="text-2xl font-bold text-yellow-600">Not Found</h2>
       <p class="text-gray-700 mt-2">The application '{{ appId }}' could not be found.</p>
       <NuxtLink to="/applications" class="mt-4 inline-block text-blue-600 hover:underline">
        &larr; Back to Applications
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref, onMounted, shallowRef } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const appId = route.params.appId as string;

const appComponent = shallowRef(null);
const loading = ref(true);
const error = ref(false);

onMounted(async () => {
  try {
    // Dynamically import the application's entry component based on the URL parameter.
    // This is a powerful Vite feature.
    const component = await import(`../../applications/${appId}/index.vue`);
    appComponent.value = defineAsyncComponent(() => Promise.resolve(component.default));
  } catch (e) {
    console.error(`Failed to load application component for '${appId}':`, e);
    error.value = true;
  } finally {
    loading.value = false;
  }
});
</script>
