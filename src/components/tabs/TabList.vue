<template>
  <div>
    <div class="tab-list">
      <slot />
    </div>
    <div class="tab-content">
      <slot :name="selectedTab" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Tab from "/Tab.vue";

const props = withDefaults(defineProps<{
  default: Tab[]
}>(), {
  default: []
});

const selectedTab = ref(props.default[0]?.name);

const selectTab = (name: string) => {
  selectedTab.value = name;
};
</script>
# rest of styles ..

  
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
  