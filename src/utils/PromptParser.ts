export type Segment = 
    | { type: 'text', content: string }
    | { type: 'placeholder', placeholder: string };

export function parsePromptTemplate(template: string): Segment[] {
    const regex = /\{([^\}]+)\}/g;
    let lastIndex = 0;
    const segments: Segment[] = [];

    let match;
    while ((match = regex.exec(template)) !== null) {
        if (match.index > lastIndex) {
            segments.push({ type: 'text', content: template.slice(lastIndex, match.index) });
        }
        segments.push({ type: 'placeholder', placeholder: match[1] });
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < template.length) {
        segments.push({ type: 'text', content: template.slice(lastIndex) });
    }

    return segments;
}
