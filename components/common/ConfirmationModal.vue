<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div class="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl" role="dialog" aria-modal="true">
          <h3 class="text-lg font-semibold" :class="titleClass">{{ title }}</h3>
          <div class="mt-2">
            <p class="text-sm text-gray-600" v-html="message"></p>
          </div>
          <div class="mt-6 flex justify-end space-x-3">
            <button @click="$emit('cancel')" type="button" class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
              Cancel
            </button>
            <button @click="$emit('confirm')" type="button" class="inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2" :class="confirmButtonClass">
              {{ confirmButtonText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type ModalVariant = 'primary' | 'danger';

const props = withDefaults(defineProps<{
  show: boolean;
  title: string;
  message: string;
  confirmButtonText?: string;
  variant?: ModalVariant;
}>(), {
  confirmButtonText: 'Confirm',
  variant: 'primary',
});

defineEmits(['confirm', 'cancel']);

const titleClass = computed(() => {
  return props.variant === 'danger' ? 'text-red-700' : 'text-gray-900';
});

const confirmButtonClass = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
    default:
      return 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500';
  }
});
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
