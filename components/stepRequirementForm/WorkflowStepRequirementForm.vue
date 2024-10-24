<template>
  <div class="border border-gray-300 rounded-lg shadow-sm overflow-hidden">
    <ContextFilePathInputAreas />
    <div class="border-t border-gray-200">
      <RequirementTextInputArea />
    </div>
  </div>
</template>

<script setup lang="ts">
import ContextFilePathInputAreas from '~/components/stepRequirementForm/ContextFilePathInputArea.vue'
import RequirementTextInputArea from '~/components/stepRequirementForm/RequirementTextInputArea.vue'
</script>