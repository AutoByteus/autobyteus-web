<template>
  <div class="tab-list">
    <!-- Modify the event handler to accept the emitted tab name -->
    <Tab v-for="tab in tabs" :key="tab.name" :name="tab.name" :selected="selectedTab === tab.name" @select="selectTab">{{ tab.name }}</Tab>
  </div>
</template>

<script setup lang="ts">
import Tab from "./Tab.vue";

const props = defineProps({
  tabs: Array,
  selectedTab: String
});

const emit = defineEmits(["select"]);

// Modify the method to accept the tabName argument
const selectTab = (tabName: string) => {
  emit('select', tabName);
};
</script>


  <style scoped>
  .tab-list {
    display: flex;
    border-bottom: 1px solid #ddd;
  }
  
  .tab-content {
    border: 1px solid #ddd;
    padding: 20px;
  }
  </style>
  