<template>
  <div class="w-full h-full overflow-y-auto bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Applications</h1>
        <p class="mt-2 text-lg text-gray-600">
          Explore specialized AI-powered applications built on the AutoByteUs platform.
        </p>
      </header>

      <div v-if="loading" class="text-center py-16">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-lg text-gray-600">Loading Applications...</p>
      </div>

      <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong class="font-bold">Error!</strong>
        <span class="block sm:inline"> Could not load applications. Please try again later.</span>
      </div>

      <div v-else-if="applications.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink
          v-for="app in applications"
          :key="app.id"
          :to="`/applications/${app.id}`"
          class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 group"
        >
          <div class="flex items-center mb-4">
            <div class="bg-blue-100 text-blue-600 p-3 rounded-full mr-4">
              <!-- Using a generic icon for now, can be replaced with dynamic icons later -->
              <span class="i-heroicons-squares-2x2-20-solid w-6 h-6"></span>
            </div>
            <h2 class="text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{{ app.name }}</h2>
          </div>
          <p class="text-gray-600">{{ app.description }}</p>
        </NuxtLink>
      </div>

      <div v-else class="text-center py-16 text-gray-500">
        <span class="i-heroicons-circle-stack-20-solid w-12 h-12 mx-auto mb-4"></span>
        <h3 class="text-xl font-medium">No Applications Found</h3>
        <p>There are no applications currently available on this server.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { ListApplications } from '~/graphql/queries/applicationQueries';
import type { ListApplicationsQuery } from '~/generated/graphql';

interface Application {
  id: string;
  name: string;
  description: string;
  icon?: string | null;
}

const applications = ref<Application[]>([]);

const { result, loading, error, onResult } = useQuery<ListApplicationsQuery>(ListApplications);

onResult((queryResult) => {
  if (queryResult.data) {
    applications.value = queryResult.data.listApplications as Application[];
  }
});
</script>
