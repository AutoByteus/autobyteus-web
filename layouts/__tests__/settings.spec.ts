import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('settings layout source', () => {
  it('renders standalone settings shell with back navigation to workspace', () => {
    const filePath = resolve(process.cwd(), 'layouts/settings.vue');
    const content = readFileSync(filePath, 'utf-8');

    expect(content).toContain('<slot />');
    expect(content).toContain("await router.push('/workspace')");
    expect(content).toContain('Back');
    expect(content).not.toContain('<AppLeftPanel');
  });
});
