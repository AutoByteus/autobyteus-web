import { onMounted, onUpdated } from 'vue';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-php';

export function usePrismHighlighter() {
  const highlightCode = () => {
    try {
      Prism.highlightAll();
    } catch (error) {
      console.error('Prism.js failed to highlight:', error);
    }
  };

  onMounted(highlightCode);
  onUpdated(highlightCode);

  return {
    highlightCode
  };
}