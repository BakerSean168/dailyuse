import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 877: ChannelConfig dual retired.
 * Exact boolean channel flags shape of ChannelPreference — type alias only.
 */
describe('notification ChannelConfig dual retired (residual 877)', () => {
  const dir = __dirname;
  const preference = readFileSync(resolve(dir, 'category-preference.ts'), 'utf8');
  const templateConfig = readFileSync(resolve(dir, 'notification-template-config.ts'), 'utf8');

  it('owns ChannelPreference sole interface body', () => {
    expect(preference).toContain('Residual 877');
    expect(preference).toMatch(/export interface ChannelPreference\b/);
    expect(preference).toContain('inApp: boolean');
    expect(preference).toContain('email: boolean');
    expect(preference).toContain('push: boolean');
    expect(preference).toContain('sms: boolean');
  });

  it('owns ChannelConfig as type alias of ChannelPreference', () => {
    expect(templateConfig).toContain('Residual 877');
    expect(templateConfig).toContain('export type ChannelConfig = ChannelPreference');
    expect(templateConfig).not.toMatch(/export interface ChannelConfig\b/);
    expect(templateConfig).toContain("from './category-preference'");
  });

  it('template config still uses ChannelConfig name for channels field', () => {
    expect(templateConfig).toContain('channels: ChannelConfig');
    expect(templateConfig).toMatch(/export interface NotificationTemplateConfigServerDTO\b/);
    expect(preference).toContain('channels: ChannelPreference');
  });
});
