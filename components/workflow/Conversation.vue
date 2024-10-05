<template>
  <div class="space-y-4 mb-4">
    <div 
      v-for="(message, index) in conversation.messages" 
      :key="message.timestamp + '-' + message.type"
      :class="[
        'p-3 rounded-lg max-w-3/4 relative shadow-sm hover:shadow-md transition-shadow duration-200',
        message.type === 'user' ? 'ml-auto bg-blue-100 text-blue-800' : 'mr-auto bg-gray-100 text-gray-800'
      ]"
    >
      <div v-if="message.type === 'user'">
        <div v-if="message.contextFilePaths && message.contextFilePaths.length > 0">
          <strong>Context Files:</strong>
          <ul class="list-disc list-inside">
            <li v-for="file in message.contextFilePaths" :key="file.path" class="truncate">
              {{ file.path }} ({{ file.type }})
            </li>
          </ul>
        </div>
        <div class="mt-2">
          <strong>User:</strong>
          <div>{{ message.text }}</div>
        </div>
      </div>
      <div v-else>
        <strong>AI:</strong>
        <div v-html="formatAIResponse(message.text)"></div>
      </div>
      <span class="text-xs text-gray-500 absolute bottom-1 right-2">
        {{ formatTimestamp(message.timestamp) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import type { Conversation, Message, ContextFilePath } from '~/types/conversation'
import Prism from 'prismjs'
import 'prismjs/themes/prism.css'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-markup-templating'
import 'prismjs/components/prism-php'
import { highlightVueCode } from '~/utils/codeHighlight'

const props = defineProps<{
  conversation: Conversation
}>()

const formatTimestamp = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatAIResponse = (text: string) => {
  // Handle code blocks, including Vue code
  return text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    let language = lang.toLowerCase() || 'plaintext'
    let highlightedCode = ''

    if (language === 'vue') {
      highlightedCode = highlightVueCode(code)
    } else {
      // For non-Vue code, use the existing highlighting method
      highlightedCode = Prism.highlight(
        code.trim(),
        Prism.languages[language] || Prism.languages.plaintext,
        language
      )
    }

    return `<pre class="language-${language}"><code>${highlightedCode}</code></pre>`
  })
}

onMounted(() => {
  Prism.highlightAll()
})
</script>

<style>
</style>
