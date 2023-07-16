<template>
  <div>
    <div class="tab-list">
      <Tab v-for="tab in tabs" :key="tab.name" @click="changeTab(tab)">{{ tab.name }}</Tab>
    </div>
  </div>
</template>

<script setup lang="ts">
import Tab from "./Tab.vue";

const props = defineProps({
  tabs: Array
});

const emit = defineEmits(["changeTab"]);

const changeTab = (tab) => {
  emit('changeTab', tab);
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
  