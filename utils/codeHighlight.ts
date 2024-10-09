// File: autobyteus-web/utils/codeHighlight.ts

import Prism from 'prismjs'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-css'

export function highlightVueCode(code: string): string {
  // Split Vue code into sections
  const templateMatch = code.match(/<template>([\s\S]*?)<\/template>/)
  const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/)
  const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/)

  // Highlight each section separately
  const templateCode = templateMatch ? Prism.highlight(templateMatch[1], Prism.languages.markup, 'markup') : ''
  const scriptCode = scriptMatch ? Prism.highlight(scriptMatch[1], Prism.languages.javascript, 'javascript') : ''
  const styleCode = styleMatch ? Prism.highlight(styleMatch[1], Prism.languages.css, 'css') : ''

  // Combine highlighted sections with proper indentation
  return `
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>template</span><span class="token punctuation">&gt;</span></span>
${templateCode}
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>template</span><span class="token punctuation">&gt;</span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">&gt;</span></span>
${scriptCode}
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">&gt;</span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>style</span><span class="token punctuation">&gt;</span></span>
${styleCode}
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>style</span><span class="token punctuation">&gt;</span></span>
  `.trim()
}