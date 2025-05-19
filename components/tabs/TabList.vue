<template>
  <div class="flex border-b border-gray-200 px-2">
    <Tab 
      v-for="tab in tabs" 
      :key="tab.name" 
      :name="tab.name" 
      :selected="selectedTab === tab.name" 
      @select="selectTab"
    >
      {{ tab.name }}
    </Tab>
  </div>
</template>

<script setup lang="ts">
import Tab from "./Tab.vue";

const props = defineProps({
  tabs: Array,
  selectedTab: String
});

const emit = defineEmits(["select"]);

const selectTab = (tabName: string) => {
  emit('select', tabName);
};
</script>
