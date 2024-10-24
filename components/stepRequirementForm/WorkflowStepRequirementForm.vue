<template>
  <div class="border border-gray-300 rounded-lg shadow-sm">
    <ContextFilePathInputAreas />

    <div class="relative mt-4">
      <RequirementTextInputArea />
    </div>
  </div>
</template>

<script setup lang="ts">
import ContextFilePathInputAreas from '~/components/stepRequirementForm/ContextFilePathInputArea.vue'
import RequirementTextInputArea from '~/components/stepRequirementForm/RequirementTextInputArea.vue'
</script>

<style scoped>
/* Add any scoped styles if necessary */
</style>