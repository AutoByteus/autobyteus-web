<template>
  <div class="flex w-full h-full bg-white font-sans">
    <Suspense>
      <template #default>
        <component :is="applicationComponent" />
      </template>
      <template #fallback>
        <div class="h-full flex flex-col items-center justify-center text-gray-500">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p class="mt-4 font-semibold">Loading Application...</p>
        </div>
      </template>
    </Suspense>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, shallowRef, watchEffect, onErrorCaptured, h } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const applicationComponent = shallowRef<any>(null);
const errorComponent = {
  render: () => h('div', { class: 'h-full flex flex-col items-center justify-center text-red-500 bg-red-50 p-8' }, [
    h('h2', { class: 'text-xl font-bold mb-2' }, 'Error Loading Application'),
    h('p', `The requested application '${route.params.id}' could not be loaded.`),
    h('button', {
      class: 'mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700',
      onClick: () => router.push('/applications')
    }, 'Back to Applications')
  ])
};

const loadComponent = () => {
  const appId = route.params.id as string;
  if (!appId) {
    applicationComponent.value = errorComponent;
    return;
  }
  
  // A simple check to prevent path traversal. In a real app, this might be a regex or allowlist.
  if (appId.includes('.') || appId.includes('/')) {
      console.error("Invalid application ID format.");
      applicationComponent.value = errorComponent;
      return;
  }
  
  applicationComponent.value = defineAsyncComponent({
    loader: () => import(`../../applications/${appId}/index.vue`),
    loadingComponent: {
      render: () => h('div', { class: 'h-full flex items-center justify-center' }, 'Loading...')
    },
    errorComponent: errorComponent
  });
};

onErrorCaptured((err, instance, info) => {
  console.error("Error loading application component:", err, info);
  applicationComponent.value = errorComponent;
  return false; // Prevent the error from propagating further
});

watchEffect(() => {
  loadComponent();
});
</script>
