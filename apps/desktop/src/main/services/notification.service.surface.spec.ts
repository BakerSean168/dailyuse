import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Notification service surface (stage-6 residual 71):
 * Emits notification click via RendererEventChannels — no string dual-track.
 */
describe('notification.service event surface', () => {
  const source = readFileSync(resolve(__dirname, 'notification.service.ts'), 'utf8');

  it('sends clicked events via RendererEventChannels', () => {
    expect(source).toContain("import { RendererEventChannels } from '@dailyuse/contracts/electron'");
    expect(source).toContain('RendererEventChannels.NOTIFICATION_CLICKED');
    expect(source).not.toMatch(/send\(\s*'notification:clicked'/);
  });
});
