
import MarkdownIt from 'markdown-it';
import markdownItPlantuml from '~/utils/markdownItPlantuml';
import { markdownItPrism } from '~/utils/markdownItPrism';
import DOMPurify from 'dompurify';

export const useMarkdown = () => {
  // Create markdown-it instance with essential configuration
  const md = new MarkdownIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true,
    highlight: null // Disable default highlighting as we'll use Prism
  });

  // Add plugins
  md.use(markdownItPlantuml);
  md.use(markdownItPrism);

  // Render markdown content with sanitization
  const renderMarkdown = (content: string): string => {
    const renderedContent = md.render(content);
    return DOMPurify.sanitize(renderedContent, {
      ADD_ATTR: ['class'], // Allow class attributes for syntax highlighting
    });
  };

  return {
    renderMarkdown
  };
};
