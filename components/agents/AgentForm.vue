<template>
  <div class="fixed inset-0 overflow-y-auto z-50 bg-gray-500 bg-opacity-75 transition-opacity">
    <div class="flex items-center justify-center min-h-screen">
      <div class="bg-white rounded-lg shadow-xl transform transition-all sm:max-w-2xl sm:w-full m-4">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg leading-6 font-medium text-gray-900">{{ formTitle }}</h3>
        </div>
        <form @submit.prevent="handleSubmit">
          <div class="px-6 py-5 space-y-6">
            <div>
              <label for="agent-name" class="block text-sm font-medium text-gray-700">Agent Name *</label>
              <input 
                type="text" 
                id="agent-name" 
                v-model="formData.name" 
                required
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., My Awesome Code Assistant"
              >
              <p v-if="formErrors.name" class="text-xs text-red-500 mt-1">{{ formErrors.name }}</p>
            </div>

            <div>
              <label for="agent-description" class="block text-sm font-medium text-gray-700">Description</label>
              <textarea 
                id="agent-description" 
                v-model="formData.description" 
                rows="3"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="A brief description of what this agent does."
              ></textarea>
            </div>

            <div>
              <label for="agent-role" class="block text-sm font-medium text-gray-700">Role</label>
              <input 
                type="text" 
                id="agent-role" 
                v-model="formData.role"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., Code Generation Specialist"
              >
            </div>

            <div>
              <label for="agent-system-prompt" class="block text-sm font-medium text-gray-700">System Prompt</label>
              <textarea 
                id="agent-system-prompt" 
                v-model="formData.systemPrompt" 
                rows="5"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., You are a helpful AI assistant that specializes in..."
              ></textarea>
            </div>

            <div>
              <label for="agent-tools" class="block text-sm font-medium text-gray-700">Tools (GitHub URLs)</label>
              <textarea 
                id="agent-tools" 
                v-model="toolsInput" 
                rows="3"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Comma-separated GitHub URLs, e.g., https://github.com/user/repo1, https://github.com/user/repo2"
              ></textarea>
              <p class="text-xs text-gray-500 mt-1">Enter full GitHub repository URLs, separated by commas.</p>
              <p v-if="formErrors.tools" class="text-xs text-red-500 mt-1">{{ formErrors.tools }}</p>
            </div>

            <div>
              <label for="agent-skills" class="block text-sm font-medium text-gray-700">Skills</label>
              <textarea 
                id="agent-skills" 
                v-model="skillsInput" 
                rows="3"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Comma-separated skills, e.g., Python, JavaScript, Data Analysis"
              ></textarea>
              <p class="text-xs text-gray-500 mt-1">Enter skills, separated by commas.</p>
            </div>
          </div>
          <div class="bg-gray-50 px-6 py-3 sm:flex sm:flex-row-reverse">
            <button 
              type="submit"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              {{ isEditing ? 'Save Changes' : 'Create Agent' }}
            </button>
            <button 
              type="button" 
              @click="handleCancel"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import type { NewLocalAgentData } from '~/stores/agents';

const props = defineProps({
  initialData: {
    type: Object as () => NewLocalAgentData | null,
    default: null,
  },
  formTitle: {
    type: String,
    default: 'Create New Local Agent',
  },
});

const emit = defineEmits(['submit', 'cancel']);

const defaultFormData = (): NewLocalAgentData => ({
  name: '',
  description: '',
  role: '',
  systemPrompt: '',
  tools: [],
  skills: [],
});

const formData = ref<NewLocalAgentData>(defaultFormData());
const toolsInput = ref('');
const skillsInput = ref('');
const isEditing = ref(false);

const formErrors = ref({
  name: '',
  tools: '',
});

const isValidUrl = (urlString: string): boolean => {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;  
  }
}

const validateForm = (): boolean => {
  let isValid = true;
  formErrors.value = { name: '', tools: '' }; // Reset errors

  if (!formData.value.name.trim()) {
    formErrors.value.name = 'Agent name is required.';
    isValid = false;
  }

  const parsedTools = toolsInput.value
    .split(',')
    .map(tool => tool.trim())
    .filter(tool => tool);
  
  for (const toolUrl of parsedTools) {
    if (!isValidUrl(toolUrl)) {
      formErrors.value.tools = `Invalid URL: "${toolUrl}". Please provide valid GitHub URLs.`;
      isValid = false;
      break; 
    }
  }
  
  return isValid;
};

const handleSubmit = () => {
  if (!validateForm()) {
    return;
  }

  const agentPayload: NewLocalAgentData = {
    ...formData.value,
    tools: toolsInput.value.split(',').map(tool => tool.trim()).filter(tool => tool),
    skills: skillsInput.value.split(',').map(skill => skill.trim()).filter(skill => skill),
  };
  emit('submit', agentPayload);
  console.log('AgentForm: Emitting submit with payload:', agentPayload);
};

const handleCancel = () => {
  emit('cancel');
  console.log('AgentForm: Emitting cancel');
};

onMounted(() => {
  if (props.initialData) {
    isEditing.value = true;
    formData.value = { ...defaultFormData(), ...props.initialData };
    toolsInput.value = props.initialData.tools?.join(', ') || '';
    skillsInput.value = props.initialData.skills?.join(', ') || '';
  } else {
     formData.value = defaultFormData(); // Ensure it's reset for creation
     toolsInput.value = '';
     skillsInput.value = '';
  }
});

watch(() => props.initialData, (newData) => {
  if (newData) {
    isEditing.value = true;
    formData.value = { ...defaultFormData(), ...newData };
    toolsInput.value = newData.tools?.join(', ') || '';
    skillsInput.value = newData.skills?.join(', ') || '';
  } else {
    isEditing.value = false;
    formData.value = defaultFormData();
    toolsInput.value = '';
    skillsInput.value = '';
  }
}, { deep: true, immediate: true });

</script>
