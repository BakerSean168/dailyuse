import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { NotificationChannels } from '@dailyuse/contracts/electron';

/**
 * Notification electron seam surface (stage-6 residual):
 * Channel registration uses contracts NotificationChannels only — no local Ch / RendererCh dual maps.
 * Custom channels remain owned by desktop custom-notification.manager but share contracts names.
 */
describe('NotificationElectronModule channel surface', () => {
  const source = readFileSync(resolve(__dirname, 'index.ts'), 'utf8');

  it('registers handlers via NotificationChannels and does not redefine local channel maps', () => {
    expect(source).toContain('NotificationChannels');
    expect(source).toContain("from '@dailyuse/contracts/electron'");
    expect(source).not.toMatch(/const Ch = \{/);
    expect(source).not.toMatch(/const RendererCh = \{/);
    expect(source).toContain('NotificationChannels.CUSTOM_RECEIVE');
    expect(source).toContain('NotificationChannels.LIST');
    expect(source).toContain('NotificationChannels.GET_UNREAD_COUNT');
    expect(source).toContain('NotificationChannels.PREFERENCES_GET');
    expect(source).toContain('NotificationChannels.PREFERENCES_UPDATE');
  });

  it('keeps core notification channels stable', () => {
    expect(NotificationChannels.LIST).toBe('notification:list');
    expect(NotificationChannels.CUSTOM_RECEIVE).toBe('notification:custom:receive');
    expect(NotificationChannels.PREFERENCES_GET).toBe('notification:preferences:get');
    expect(NotificationChannels.PREFERENCES_UPDATE).toBe('notification:preferences:update');
  });
});
