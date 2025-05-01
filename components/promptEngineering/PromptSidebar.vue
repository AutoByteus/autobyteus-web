<template>
  <div class="w-64 bg-white shadow-sm h-full">
    <div class="p-6">
      <h2 class="text-xl font-semibold text-gray-800 mb-6">{{ title }}</h2>
      <nav>
        <ul class="space-y-2">
          <li v-for="item in menuItems" :key="item.id">
            <button 
              @click="$emit('navigate', item.id)"
              class="w-full text-left px-4 py-2 rounded hover:bg-gray-100 transition-colors"
              :class="{'bg-gray-100 font-bold': currentView === item.id}"
            >
              {{ item.label }}
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
interface MenuItem {
  id: string;
  label: string;
}

const props = defineProps<{  title: string;
  menuItems: MenuItem[];
  currentView: string;
}>();

defineEmits<{  (e: 'navigate', view: string): void;
}>();
</script>
