/**
 * Structural + locale checks for the unverified-email shell banner (P2).
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import zhCN from '../../locales/zh-CN';
import enUS from '../../locales/en-US';

const shellSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), 'AppShell.vue'),
  'utf8',
);

function resolveMsg(messages: Record<string, unknown>, key: string): unknown {
  let cur: unknown = messages;
  for (const part of key.split('.')) {
    if (cur == null || typeof cur !== 'object' || !(part in (cur as object))) {
      return undefined;
    }
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

describe('unverified email banner', () => {
  it('uses i18n keys without English-only hardcode fallbacks', () => {
    expect(shellSource).toContain("t('shell.auth.unverifiedBanner')");
    expect(shellSource).toContain("t('shell.auth.unverifiedAction')");
    // No second-arg English hardcode on those calls
    expect(shellSource).not.toMatch(/t\(\s*['"]shell\.auth\.unverifiedBanner['"]\s*,\s*['"]Verify/);
  });

  it('uses high-contrast warning token classes (amber-100 / amber-950)', () => {
    expect(shellSource).toMatch(/bg-amber-100/);
    expect(shellSource).toMatch(/text-amber-950/);
    // Light mode must use dark-on-light amber (not the old amber-100-on-transparent pairing)
    const bannerBlock = shellSource.match(
      /data-testid="unverified-email-banner"[\s\S]{0,350}?role="status"/,
    )?.[0];
    expect(bannerBlock).toBeTruthy();
    expect(bannerBlock).toMatch(/bg-amber-100/);
    expect(bannerBlock).toMatch(/text-amber-950/);
    // Default (non-dark) text must not be text-amber-100 alone
    expect(bannerBlock).toMatch(/text-amber-950/);
  });

  it('has translated banner copy in zh-CN and en-US', () => {
    const zhBanner = resolveMsg(zhCN as Record<string, unknown>, 'shell.auth.unverifiedBanner');
    const enBanner = resolveMsg(enUS as Record<string, unknown>, 'shell.auth.unverifiedBanner');
    const zhAction = resolveMsg(zhCN as Record<string, unknown>, 'shell.auth.unverifiedAction');
    const enAction = resolveMsg(enUS as Record<string, unknown>, 'shell.auth.unverifiedAction');
    expect(typeof zhBanner).toBe('string');
    expect(typeof enBanner).toBe('string');
    expect(typeof zhAction).toBe('string');
    expect(typeof enAction).toBe('string');
    expect(String(zhBanner)).not.toContain('shell.auth');
    expect(String(enBanner).toLowerCase()).toMatch(/email|verif/);
  });
});
