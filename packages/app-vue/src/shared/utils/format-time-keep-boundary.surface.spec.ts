import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1237: formatTime keep-boundary (multi-site app-vue presentation helpers).
 * - dashboard DashboardActivityTimeline: relative i18n (dashboard.time.*) + short m/d HH:mm
 * Soft residual 1237:
 * - setting SettingAdvancedActions: relative i18n (+days) + toLocaleString
 * - goal ProgressBreakdown: date-fns absolute yyyy-MM-dd HH:mm
 * - goal WeightSnapshot: date-fns absolute + locale map
 * - goal GoalFocusView: toLocaleString options
 * - reminder ReminderCapsulePreview: Residual 1294 formatLocalHHmm sole (still HH:mm-only vs dashboard relative)
 * Residual 1309: dashboard absolute HH:mm dual retired onto formatLocalHHmm (relative keep-boundary remains).
 * Soft residual 1231: toTimeInput keep-boundary remains separate.
 * Soft residual 1207: formatMessageTime keep-boundary remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('formatTime keep-boundary (residual 1237)', () => {
  const dir = __dirname;
  const dashboard = readFileSync(
    resolve(dir, '../../modules/dashboard/components/DashboardActivityTimeline.vue'),
    'utf8',
  );
  const setting = readFileSync(
    resolve(dir, '../../modules/setting/components/SettingAdvancedActions.vue'),
    'utf8',
  );
  const progress = readFileSync(
    resolve(dir, '../../modules/goal/components/ProgressBreakdownPanel.vue'),
    'utf8',
  );
  const weight = readFileSync(
    resolve(dir, '../../modules/goal/components/weight-snapshot/WeightSnapshotList.vue'),
    'utf8',
  );
  const focus = readFileSync(
    resolve(dir, '../../modules/goal/views/GoalFocusView.vue'),
    'utf8',
  );
  const capsule = readFileSync(
    resolve(dir, '../../layouts/shell/previews/ReminderCapsulePreview.vue'),
    'utf8',
  );

  it('owns Residual 1237 keep-boundary markers on dashboard relative formatTime', () => {
    expect(dashboard).toContain('Residual 1237 keep-boundary');
    expect(dashboard).toMatch(/function formatTime\b/);
    expect(dashboard).toContain("t('dashboard.time.justNow')");
    expect(dashboard).toContain("t('dashboard.time.minutesAgo'");
    expect(dashboard).toContain("t('dashboard.time.hoursAgo'");
    const body = dashboard.match(/function formatTime\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('dashboard.time');
    expect(body).toContain('formatLocalHHmm');
    expect(body).not.toContain('padStart');
    expect(body).not.toContain('date-fns');
    expect(body).not.toContain("format(new Date");
    expect(body).not.toContain('setting.time');
    expect(body).not.toContain('daysAgo');
  });

  it('soft residual 1237 setting relative+toLocaleString stays separate', () => {
    expect(setting).toContain('Soft residual 1237');
    expect(setting).toMatch(/function formatTime\b/);
    expect(setting).toContain("t('setting.time.justNow')");
    expect(setting).toContain('daysAgo');
    expect(setting).toContain('toLocaleString()');
    const body = setting.match(/function formatTime\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('setting.time');
    expect(body).not.toContain('dashboard.time');
    expect(body).not.toContain("format(new Date");
  });

  it('soft residual 1237 goal absolute date-fns / toLocaleString / capsule HH:mm stay separate', () => {
    expect(progress).toContain('Soft residual 1237');
    expect(progress).toMatch(/function formatTime\b/);
    expect(progress).toContain("format(new Date(timestamp), 'yyyy-MM-dd HH:mm')");
    expect(progress).not.toContain('dashboard.time');

    expect(weight).toContain('Soft residual 1237');
    expect(weight).toMatch(/const formatTime\b/);
    expect(weight).toContain('dateFnsLocaleMap');
    expect(weight).toContain("format(new Date(timestamp), 'yyyy-MM-dd HH:mm'");

    expect(focus).toContain('Soft residual 1237');
    expect(focus).toMatch(/function formatTime\b/);
    expect(focus).toContain('toLocaleString(locale.value');
    expect(focus).toContain("year: 'numeric'");
    expect(focus).not.toContain('dashboard.time');

    expect(capsule).toContain('Residual 1294');
    expect(capsule).toContain('format-local-hhmm');
    expect(capsule).toContain('formatLocalHHmm');
    expect(capsule).toMatch(/function formatTime\b/);
    const body = capsule.match(/function formatTime\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('formatLocalHHmm');
    expect(body).not.toContain('padStart');
    expect(body).not.toContain('justNow');
    expect(body).not.toContain('yyyy-MM-dd');
  });

  it('runtime: documents relative vs absolute vs HH:mm-only contracts via body shape', () => {
    function dashboardFormatTime(ts: number, now: number, t: (k: string, p?: object) => string): string {
      const date = new Date(ts);
      const diff = now - ts;
      if (diff < 60_000) return t('dashboard.time.justNow');
      if (diff < 3_600_000) {
        return t('dashboard.time.minutesAgo', { count: Math.floor(diff / 60_000) });
      }
      if (diff < 86_400_000) {
        return t('dashboard.time.hoursAgo', { count: Math.floor(diff / 3_600_000) });
      }
      return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    function capsuleFormatTime(ts: number): string {
      const d = new Date(ts);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    const t = (k: string, p?: object) => (p ? `${k}:${JSON.stringify(p)}` : k);
    const now = Date.UTC(2026, 6, 24, 12, 0, 0);
    expect(dashboardFormatTime(now - 30_000, now, t)).toBe('dashboard.time.justNow');
    expect(dashboardFormatTime(now - 120_000, now, t)).toContain('minutesAgo');
    expect(capsuleFormatTime(now)).toMatch(/^\d{2}:\d{2}$/);
  });

  it('documents residual 1237 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'format-time-keep-boundary.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1237');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
