import MarkdownIt from 'markdown-it';
import markdownItPlantuml from '~/utils/markdownItPlantuml';

export const useMarkdown = () => {
  // Create markdown-it instance if not already created
  const md = new MarkdownIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true
  });

  // Add plugins
  md.use(markdownItPlantuml);

  // Render markdown content
  const renderMarkdown = (content: string): string => {
    return md.render(content);
  };

  return {
    renderMarkdown
  };
};