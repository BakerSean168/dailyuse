import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1216: formatTimestamp keep-boundary (app-vue schedule export vs app-react local).
 * - app-vue schedule-presentation: number|null|undefined → toLocaleString; empty/invalid → '-'
 * - app-react ScheduleTaskCard: number|null local; same empty/invalid '-' path; no shared import
 * Soft residual 1216: TimelineControls delegates formatTimelineTimestamp (empty '').
 * Soft residual 1213: formatTimeRange keep-boundary remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('formatTimestamp keep-boundary (residual 1216)', () => {
  const dir = __dirname;
  const vue = readFileSync(
    resolve(dir, '../../modules/schedule/utils/schedule-presentation.ts'),
    'utf8',
  );
  const react = readFileSync(
    resolve(dir, '../../../../app-react/src/components/ScheduleTaskCard.tsx'),
    'utf8',
  );
  const timeline = readFileSync(
    resolve(dir, '../../modules/goal/components/timeline/TimelineControls.vue'),
    'utf8',
  );

  it('owns Residual 1216 keep-boundary markers on app-vue schedule formatTimestamp', () => {
    expect(vue).toContain('Residual 1216 keep-boundary');
    expect(vue).toMatch(/export function formatTimestamp\b/);
    expect(vue).toContain('number | null | undefined');
    expect(vue).toContain("return '-'");
    expect(vue).toContain('toLocaleString()');
    const body = vue.match(/export function formatTimestamp\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('isNaN');
    expect(body).toContain('toLocaleString');
    expect(body).not.toContain('formatTimelineTimestamp');
    expect(body).not.toContain("return ''");
  });

  it('differs from app-react package-local formatTimestamp (no force-merge)', () => {
    expect(react).toContain('Residual 1216 keep-boundary');
    expect(react).toMatch(/function formatTimestamp\b/);
    expect(react).toContain('Soft residual 1216');
    expect(react).toContain('number | null');
    expect(react).toContain("return '-'");
    expect(react).toContain('toLocaleString()');
    const body = react.match(/function formatTimestamp\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('isNaN');
    expect(body).not.toContain('export function formatTimestamp');
    expect(body).not.toContain('null | undefined');
    expect(body).not.toContain('formatTimelineTimestamp');
    // No cross-package import of schedule presentation / utils (function-body-scoped).
    expect(body).not.toMatch(/from ['"][^'"]*schedule-presentation/);
    expect(body).not.toMatch(/from ['"]@dailyuse\/utils/);
    expect(react).not.toMatch(/from ['"]@dailyuse\/utils/);
  });

  it('soft residual 1216 timeline formatTimestamp stays formatTimelineTimestamp delegate', () => {
    expect(timeline).toContain('Soft residual 1216');
    expect(timeline).toMatch(/function formatTimestamp\b/);
    expect(timeline).toContain('formatTimelineTimestamp');
    expect(timeline).toContain("return ''");
    expect(timeline).not.toContain('toLocaleString()');
  });

  it('runtime: documents empty/invalid contracts via body shape', () => {
    function scheduleFormatTimestamp(timestamp: number | null | undefined): string {
      if (!timestamp) return '-';
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleString();
    }
    function reactFormatTimestamp(timestamp: number | null): string {
      if (!timestamp) return '-';
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleString();
    }
    function timelineFormatTimestamp(timestamp: number | undefined): string {
      if (!timestamp) return '';
      return `t:${timestamp}`;
    }
    expect(scheduleFormatTimestamp(null)).toBe('-');
    expect(scheduleFormatTimestamp(undefined)).toBe('-');
    expect(reactFormatTimestamp(null)).toBe('-');
    expect(timelineFormatTimestamp(undefined)).toBe('');
    const fixed = Date.UTC(2024, 0, 2, 12, 0, 0);
    expect(typeof scheduleFormatTimestamp(fixed)).toBe('string');
    expect(scheduleFormatTimestamp(fixed).length).toBeGreaterThan(0);
    expect(typeof reactFormatTimestamp(fixed)).toBe('string');
  });

  it('documents residual 1216 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'format-timestamp-keep-boundary.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1216');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
