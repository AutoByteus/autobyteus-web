<template>
    <textarea 
        ref="textareaRef"
        :value="modelValue"
        @input="handleInput"
        class="resizable-textarea"
    ></textarea>
</template>
  
<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';

const props = defineProps({
    modelValue: String
});

const emit = defineEmits(['update:modelValue']);
const textareaRef = ref(null);

const handleInput = (event: Event) => {
    resizeTextarea();
    emit('update:modelValue', event.target.value);
};

const resizeTextarea = () => {
    const textarea = textareaRef.value;
    if (textarea) {
        const currentHeight = textarea.clientHeight;
        const scrollHeight = textarea.scrollHeight;

        if (currentHeight !== scrollHeight) {
            textarea.style.height = scrollHeight + 'px';
        }
    }
};

onMounted(() => {
    nextTick(() => {
        resizeTextarea();
    });
});
</script>

<style>
.resizable-textarea {
    /* ... common styles here ... */
}
</style>
