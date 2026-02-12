import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('messaging page', () => {
  it('mounts messaging setup manager as route-host content', () => {
    const filePath = resolve(process.cwd(), 'pages/messaging.vue');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('<MessagingSetupManager />');
    expect(content).toContain("import MessagingSetupManager from '~/components/settings/MessagingSetupManager.vue';");
  });
});
