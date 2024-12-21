
import MarkdownIt from 'markdown-it';
import Prism from 'prismjs';

// Import required Prism components
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';

export function markdownItPrism(md: MarkdownIt) {
  const fence = md.renderer.rules.fence!;

  md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
    const token = tokens[idx];
    const lang = token.info.trim();
    
    // If language is specified
    if (lang) {
      try {
        const highlighted = Prism.highlight(
          token.content,
          Prism.languages[lang] || Prism.languages.plaintext,
          lang
        );

        const languageClass = `language-${lang}`;
        
        return `<pre class="${languageClass}"><code class="${languageClass}">${highlighted}</code></pre>`;
      } catch (error) {
        console.warn('Error highlighting code block:', error);
      }
    }

    // Fallback to default fence rendering
    return fence(tokens, idx, options, env, slf);
  };
}
