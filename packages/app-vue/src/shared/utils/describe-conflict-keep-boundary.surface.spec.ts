import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1246: describeConflict keep-boundary (react English pill vs vue i18n conflict summary).
 * - app-react ScheduleEventEditorScreen: English 'No conflict detected' / 'N conflicts detected'
 * - app-vue ScheduleConflictAlert: schedule.conflictAlert.noConflict / conflictsDetected i18n
 * Soft residual 1246:
 * - ConflictAlert: hasConflict-only conflictsDetected; formatSuggestion advanceTo/delayTo/shortenTo
 * Soft residual 1243: formatDuration keep-boundary remains separate.
 * Soft residual 1240: formatDate keep-boundary remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('describeConflict keep-boundary (residual 1246)', () => {
  const dir = __dirname;
  const react = readFileSync(
    resolve(dir, '../../../../app-react/src/screens/ScheduleEventEditorScreen.tsx'),
    'utf8',
  );
  const scheduleAlert = readFileSync(
    resolve(dir, '../../modules/schedule/components/ScheduleConflictAlert.vue'),
    'utf8',
  );
  const conflictAlert = readFileSync(
    resolve(dir, '../../modules/schedule/components/ConflictAlert.vue'),
    'utf8',
  );

  it('owns Residual 1246 keep-boundary markers on react English describeConflict', () => {
    expect(react).toContain('Residual 1246 keep-boundary');
    expect(react).toMatch(/function describeConflict\b/);
    expect(react).toContain('No conflict detected');
    expect(react).toContain('conflicts detected');
    const body = react.match(/function describeConflict\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('hasConflict');
    expect(body).toContain('No conflict detected');
    expect(body).toContain('conflicts.length');
    expect(body).not.toContain('schedule.conflictAlert');
    expect(body).not.toContain('noConflict');
    expect(body).not.toMatch(/\bt\(/);
  });

  it('differs from vue ScheduleConflictAlert i18n conflict summary (no force-merge)', () => {
    expect(scheduleAlert).toContain('Residual 1246 keep-boundary');
    expect(scheduleAlert).toContain('schedule.conflictAlert.noConflict');
    expect(scheduleAlert).toContain('schedule.conflictAlert.conflictsDetected');
    expect(scheduleAlert).toContain('!conflicts.hasConflict');
    expect(scheduleAlert).toContain('conflicts?.hasConflict');
    expect(scheduleAlert).not.toContain('No conflict detected');
    expect(scheduleAlert).not.toContain('conflicts detected');
    expect(scheduleAlert).not.toMatch(/function describeConflict\b/);
  });

  it('soft residual 1246 ConflictAlert hasConflict-only + formatSuggestion key dual stays separate', () => {
    expect(conflictAlert).toContain('Soft residual 1246');
    expect(conflictAlert).toContain('schedule.conflictAlert.conflictsDetected');
    expect(conflictAlert).not.toContain('schedule.conflictAlert.noConflict');
    expect(conflictAlert).not.toContain('No conflict detected');
    const suggestion = conflictAlert.match(/function formatSuggestion\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(suggestion).toContain('schedule.conflictAlert.advanceTo');
    expect(suggestion).toContain('schedule.conflictAlert.delayTo');
    expect(suggestion).toContain('schedule.conflictAlert.shortenTo');
    expect(suggestion).not.toContain('schedule.conflictAlert.moveEarlier');
    expect(suggestion).not.toContain('schedule.conflictAlert.moveLater');
    expect(suggestion).not.toContain('schedule.conflictAlert.shortenDuration');

    const scheduleSuggestion =
      scheduleAlert.match(/const getSuggestionLabel = \([\s\S]*?\n\};/)?.[0] ?? '';
    expect(scheduleSuggestion).toContain('schedule.conflictAlert.moveEarlier');
    expect(scheduleSuggestion).toContain('schedule.conflictAlert.moveLater');
    expect(scheduleSuggestion).toContain('schedule.conflictAlert.shortenDuration');
    expect(scheduleSuggestion).not.toContain('schedule.conflictAlert.advanceTo');
  });

  it('runtime: documents English pill vs i18n key contracts via body shape', () => {
    function describeConflict(conflicts: { hasConflict: boolean; conflicts: unknown[] } | null) {
      if (!conflicts?.hasConflict) {
        return 'No conflict detected';
      }
      return `${conflicts.conflicts.length} conflicts detected`;
    }
    function vueSummary(
      conflicts: { hasConflict: boolean; conflicts: unknown[] } | null,
      t: (k: string, p?: object) => string,
    ): string {
      if (!conflicts) return '';
      if (!conflicts.hasConflict) return t('schedule.conflictAlert.noConflict');
      return t('schedule.conflictAlert.conflictsDetected', { n: conflicts.conflicts.length });
    }
    const t = (k: string, p?: object) => (p ? `${k}:${JSON.stringify(p)}` : k);
    expect(describeConflict(null)).toBe('No conflict detected');
    expect(describeConflict({ hasConflict: false, conflicts: [] })).toBe('No conflict detected');
    expect(describeConflict({ hasConflict: true, conflicts: [1, 2] })).toBe('2 conflicts detected');
    expect(vueSummary({ hasConflict: false, conflicts: [] }, t)).toContain('noConflict');
    expect(vueSummary({ hasConflict: true, conflicts: [1] }, t)).toContain('conflictsDetected');
    expect(vueSummary({ hasConflict: true, conflicts: [1] }, t)).toContain('"n":1');
  });

  it('documents residual 1246 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'describe-conflict-keep-boundary.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1246');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
