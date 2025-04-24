<template>
  <div class="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="modal-content bg-white p-6 rounded-lg shadow-lg w-96">
      <h2 class="text-2xl font-semibold mb-4">Create New Prompt</h2>
      <form @submit.prevent="handleSave">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">Name</label>
          <input v-model="name" type="text" class="w-full border rounded px-3 py-2" required />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">Category</label>
          <input v-model="category" type="text" class="w-full border rounded px-3 py-2" required />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">Prompt Content</label>
          <textarea v-model="promptContent" rows="4" class="w-full border rounded px-3 py-2" required></textarea>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">Description</label>
          <textarea v-model="description" rows="2" class="w-full border rounded px-3 py-2"></textarea>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">Suitable for Model</label>
          <input v-model="suitableForModel" type="text" class="w-full border rounded px-3 py-2" />
        </div>
        <div class="flex justify-end space-x-2">
          <button type="button" @click="closeModal" class="px-4 py-2 border rounded">Cancel</button>
          <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineEmits } from 'vue';
import { usePromptStore } from '~/stores/promptStore';

const emit = defineEmits(['close']);
const name = ref('');
const category = ref('');
const promptContent = ref('');
const description = ref('');
const suitableForModel = ref('');
const promptStore = usePromptStore();

const handleSave = async () => {
  try {
    await promptStore.createPrompt(
      name.value,
      category.value,
      promptContent.value,
      description.value || undefined,
      suitableForModel.value || undefined
    );
    emit('close');
  } catch (e) {
    console.error('Failed to create prompt', e);
  }
};

const closeModal = () => {
  emit('close');
};
</script>

<style scoped>
.modal-overlay {
  backdrop-filter: blur(2px);
}
</style>
