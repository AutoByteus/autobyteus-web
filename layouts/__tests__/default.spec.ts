import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('default layout source', () => {
  it('renders current node label in both mobile and desktop chrome', () => {
    const filePath = resolve(process.cwd(), 'layouts/default.vue');
    const content = readFileSync(filePath, 'utf-8');

    expect(content).toContain('{{ currentNodeLabel }}');
    expect(content).toContain('text-[11px]');
    expect(content).toContain('rounded-full bg-white');
  });

  it('closes mobile menu on route changes via watcher', () => {
    const filePath = resolve(process.cwd(), 'layouts/default.vue');
    const content = readFileSync(filePath, 'utf-8');

    expect(content).toContain('watch(');
    expect(content).toContain('() => route.fullPath');
    expect(content).toContain('appLayoutStore.closeMobileMenu()');
  });
});
