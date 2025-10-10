<template>
  <div class="flex-1 overflow-auto p-8">
    <div class="max-w-full mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Applications</h1>
        <p class="text-gray-500 mt-1">Explore and run available applications.</p>
      </div>

      <div v-if="loading" class="text-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
        <p>Loading applications...</p>
      </div>
      <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded-md p-4">
        <p class="font-bold">Error loading applications:</p>
        <p>{{ error.message }}</p>
      </div>
      <div v-else-if="applications.length > 0" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <ApplicationCard
          v-for="app in applications"
          :key="app.id"
          :application="app"
        />
      </div>
      <div v-else class="text-center bg-gray-50 rounded-lg py-12 px-6 border border-gray-200">
         <h3 class="text-lg font-medium text-gray-900">No Applications Found</h3>
         <p class="mt-1 text-sm text-gray-500">
            There are no applications available at the moment.
         </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { ListApplications } from '~/graphql/queries/applicationQueries';
import ApplicationCard from '~/components/applications/ApplicationCard.vue';
import type { ListApplicationsQuery } from '~/generated/graphql';

const { result, loading, error } = useQuery<ListApplicationsQuery>(ListApplications);

const applications = computed(() => result.value?.listApplications || []);
</script>
