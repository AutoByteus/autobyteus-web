<template>
  <div class="think-segment">
    <button @click="toggle" class="think-toggle-button">
      <span class="icon" :class="{ 'is-expanded': showContent }">›</span>
      <span class="button-text">{{ showContent ? 'Hide' : 'Show' }} Thinking Output</span>
    </button>
    <transition name="fade-slide">
      <div v-if="showContent" class="think-content">
        <MarkdownRenderer :content="content" />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MarkdownRenderer from '~/components/conversation/segments/renderer/MarkdownRenderer.vue';

const props = defineProps<{ content: string }>();
const showContent = ref(false);

const toggle = () => {
  showContent.value = !showContent.value;
};
</script>

<style scoped>
.think-segment {
  margin: 1em 0;
  border-radius: 8px;
  padding: 1em;
  background-color: #f9f9f9;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.think-toggle-button {
  background-color: #edf2f7;
  color: #2d3748;
  border: 1px solid #e2e8f0;
  padding: 0.5em 1em;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.5em;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.think-toggle-button:hover {
  background-color: #e2e8f0;
  border-color: #cbd5e0;
  color: #1a202c;
}

.button-text {
  font-weight: 500;
  font-size: 0.95rem;
  letter-spacing: 0.01em;
}

.icon {
  font-size: 20px;
  line-height: 1;
  transform: rotate(90deg);
  transition: transform 0.2s ease;
  color: #4a5568;
  display: inline-block;
  width: 20px;
  height: 20px;
  text-align: center;
  font-weight: 600;
}

.icon.is-expanded {
  transform: rotate(270deg);
}

.think-content {
  margin-top: 0.75em;
  padding: 1em;
  background: #ffffff;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  line-height: 1.6;
  font-size: 1rem;
}

.fade-slide-enter-active, .fade-slide-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-slide-enter, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
