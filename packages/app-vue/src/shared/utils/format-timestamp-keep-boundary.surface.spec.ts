import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1216 (P1/P2): formatTimestamp package-boundary keep-boundary.
 * - app-vue schedule-presentation: exported util over product-time
 * - app-react ScheduleTaskCard: scheduleTimestamp via session product-time + empty catalog
 * Soft residual 1216: TimelineControls uses formatProductDateTime.
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

  it('app-vue schedule exports timestamp helper over product-time', () => {
    expect(vue).toContain('Residual 1216');
    expect(
      vue.includes('formatScheduleTimestamp') || vue.includes('formatTimestamp'),
    ).toBe(true);
    expect(
      vue.includes('formatProductDateTime') ||
        vue.includes('productTime') ||
        vue.includes('getProductTime'),
    ).toBe(true);
  });

  it('app-react schedule card uses session product-time (no createTimeFacade)', () => {
    expect(react).toContain('Residual 1216');
    expect(react).not.toContain('createTimeFacade');
    expect(react).not.toMatch(/function formatTimestamp\b/);
    expect(react).toContain('formatProductDateTime');
    expect(react).toContain("emptyKind('dash')");
  });

  it('soft residual 1216 timeline uses formatProductDateTime', () => {
    expect(timeline).toContain('formatProductDateTime');
    expect(timeline).not.toMatch(/function formatTimestamp\b/);
    expect(timeline).not.toContain('toLocaleString()');
  });
});
