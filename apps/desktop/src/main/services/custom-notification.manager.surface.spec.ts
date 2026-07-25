import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { NotificationChannels, RendererEventChannels } from '@dailyuse/contracts/electron';

/**
 * Custom notification IPC surface (stage-6 residual 71):
 * Registers via contracts NotificationChannels, emits RendererEventChannels,
 * and returns Result ok envelopes (no raw dual-track payloads / string channels).
 */
describe('custom-notification.manager channel surface', () => {
  const source = readFileSync(resolve(__dirname, 'custom-notification.manager.ts'), 'utf8');

  it('registers via contracts NotificationChannels and Result ok envelopes', () => {
    expect(source).toContain(
      "import { NotificationChannels, RendererEventChannels } from '@dailyuse/contracts/electron'",
    );
    expect(source).toContain("import { ok } from '@dailyuse/contracts/result'");
    expect(source).toContain('NotificationChannels.CUSTOM_CLICK');
    expect(source).toContain('NotificationChannels.CUSTOM_RENDERER_READY');
    expect(source).toContain('return ok(null)');
    expect(source).toContain('return ok(true)');
    expect(source).not.toMatch(/ipcMain\.handle\(\s*'notification:/);
    expect(source).not.toMatch(/return\s+true;/);
    expect(source).not.toMatch(/success:\s*true/);
  });

  it('emits notification clicked via RendererEventChannels only', () => {
    expect(source).toContain('RendererEventChannels.NOTIFICATION_CLICKED');
    expect(source).not.toMatch(/send\(\s*'notification:clicked'/);
    expect(RendererEventChannels.NOTIFICATION_CLICKED).toBe('notification:clicked');
    expect(NotificationChannels.CUSTOM_RENDERER_READY).toBe('notification:custom:renderer-ready');
  });
});
