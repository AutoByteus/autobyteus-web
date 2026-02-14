<template>
  <div class="flex h-screen h-[100dvh] flex-col bg-gray-100">
    <header class="flex h-14 flex-shrink-0 items-center border-b border-gray-200 bg-white px-4">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
        @click="handleBack"
      >
        <span class="i-heroicons-arrow-left-20-solid h-4 w-4" />
        <span>Back</span>
      </button>
    </header>

    <main class="min-h-0 flex-1 overflow-hidden">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const handleBack = async (): Promise<void> => {
  try {
    await router.push('/workspace');
  } catch (error) {
    console.error('settings layout navigation error:', error);
  }
};
</script>
