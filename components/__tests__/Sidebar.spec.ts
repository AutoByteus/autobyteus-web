import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Sidebar', () => {
  it('renders Memory navigation link', () => {
    const filePath = resolve(process.cwd(), 'components/Sidebar.vue');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('to="/memory"');
  });
});
