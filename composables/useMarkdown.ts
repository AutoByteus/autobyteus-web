import MarkdownIt from 'markdown-it';
import markdownItPlantuml from '~/utils/markdownItPlantuml';
import DOMPurify from 'dompurify';

export const useMarkdown = () => {
  // Create markdown-it instance with essential configuration
  const md = new MarkdownIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true
  });

  // Add plugins
  md.use(markdownItPlantuml);

  // Render markdown content with sanitization
  const renderMarkdown = (content: string): string => {
    const renderedContent = md.render(content);
    return DOMPurify.sanitize(renderedContent);
  };

  return {
    renderMarkdown
  };
};