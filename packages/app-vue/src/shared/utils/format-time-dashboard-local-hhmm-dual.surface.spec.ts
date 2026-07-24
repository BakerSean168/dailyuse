import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatLocalHHmm } from './format-local-hhmm';

/**
 * Residual 1309: dashboard formatTime absolute HH:mm dual retired onto formatLocalHHmm sole.
 * Residual 1237 relative i18n keep-boundary remains (justNow/minutesAgo/hoursAgo via dashboard.time.*).
 * Soft residual: setting relative+toLocaleString, goal date-fns/toLocaleString stay separate;
 * form hour/minute padStart option lists (TimeConfig/Reminder/CreateSchedule) not force-merged.
 * Does not flip §13.2 checkboxes.
 */
describe('dashboard formatTime absolute HH:mm dual retired (residual 1309)', () => {
  const dir = __dirname;
  const dashboard = readFileSync(
    resolve(dir, '../../modules/dashboard/components/DashboardActivityTimeline.vue'),
    'utf8',
  );
  const sole = readFileSync(resolve(dir, 'format-local-hhmm.ts'), 'utf8');

  it('owns Residual 1309 composition on dashboard absolute branch', () => {
    expect(dashboard).toContain('Residual 1309');
    expect(dashboard).toContain('formatLocalHHmm');
    expect(dashboard).toContain('Residual 1237 keep-boundary');
    expect(sole).toMatch(/export function formatLocalHHmm\b/);
    const body = dashboard.match(/function formatTime\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('dashboard.time');
    expect(body).toContain('formatLocalHHmm');
    expect(body).not.toContain('padStart');
    expect(body).not.toContain('getHours');
    expect(body).not.toContain('getMinutes');
  });

  it('keeps Residual 1237 relative i18n keep-boundary (no force-merge to HH:mm-only)', () => {
    const body = dashboard.match(/function formatTime\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain("t('dashboard.time.justNow')");
    expect(body).toContain("t('dashboard.time.minutesAgo'");
    expect(body).toContain("t('dashboard.time.hoursAgo'");
    expect(body).toContain('getMonth');
    expect(body).toContain('getDate');
  });

  it('soft residual: setting/goal formatTime keep-boundaries stay separate', () => {
    const setting = readFileSync(
      resolve(dir, '../../modules/setting/components/SettingAdvancedActions.vue'),
      'utf8',
    );
    const progress = readFileSync(
      resolve(dir, '../../modules/goal/components/ProgressBreakdownPanel.vue'),
      'utf8',
    );
    expect(setting).toContain('Soft residual 1237');
    expect(setting).toContain('toLocaleString()');
    expect(setting).not.toContain('formatLocalHHmm');
    expect(progress).toContain('Soft residual 1237');
    expect(progress).toContain("format(new Date(timestamp), 'yyyy-MM-dd HH:mm')");
    expect(progress).not.toContain('formatLocalHHmm');
  });

  it('runtime: formatLocalHHmm pads absolute clock used by dashboard fallback shape', () => {
    const ms = new Date(2026, 6, 24, 9, 5, 0).getTime();
    expect(formatLocalHHmm(ms)).toBe('09:05');
    const date = new Date(ms);
    expect(`${date.getMonth() + 1}/${date.getDate()} ${formatLocalHHmm(ms)}`).toBe('7/24 09:05');
  });

  it('documents residual 1309 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'format-time-dashboard-local-hhmm-dual.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1309');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
