import { describe, it, expect, beforeEach } from 'vitest';
import MarkdownIt from 'markdown-it';
import markdownItPlantuml from '../markdownItPlantuml';

describe('markdownItPlantuml', () => {
  let md: MarkdownIt;

  beforeEach(() => {
    md = new MarkdownIt();
    md.use(markdownItPlantuml);
  });

  it('should render plantuml code block with proper structure', () => {
    const input = '```plantuml\n@startuml\nA -> B\n@enduml\n```';
    const result = md.render(input);

    expect(result).toMatch(/<div class="plantuml-diagram"/);
    expect(result).toMatch(/data-content=".*"/);
    expect(result).toMatch(/Loading diagram/);
    expect(result).toMatch(/class="error"/);
  });

  it('should encode plantuml content properly', () => {
    const plantUmlContent = '@startuml\nA -> B\n@enduml';
    const input = '```plantuml\n' + plantUmlContent + '\n```';
    const result = md.render(input);

    const encodedContent = encodeURIComponent(plantUmlContent);
    expect(result).toContain(`data-content="${encodedContent}"`);
  });

  it('should handle multiple plantuml blocks', () => {
    const input = [
      '```plantuml\n@startuml\nA -> B\n@enduml\n```',
      'Some text',
      '```plantuml\n@startuml\nC -> D\n@enduml\n```'
    ].join('\n');

    const result = md.render(input);
    const matches = result.match(/<div class="plantuml-diagram"/g);
    expect(matches).toHaveLength(2);
  });

  it('should not affect other code blocks', () => {
    const input = '```javascript\nconst x = 1;\n```';
    const result = md.render(input);
    expect(result).not.toContain('plantuml-diagram');
    expect(result).toContain('language-javascript');
  });
});