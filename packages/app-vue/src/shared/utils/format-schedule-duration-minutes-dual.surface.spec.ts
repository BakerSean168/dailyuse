import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatScheduleDurationMinutes } from './format-schedule-duration-minutes';

/**
 * Residual 1324: ScheduleConflictAlert + ScheduleFormDemo minutes formatDuration dual
 * retired onto formatScheduleDurationMinutes sole.
 * Soft residual: ConflictAlert ms floor (always hoursMinutes when h>0);
 * schedule-presentation durationMs/Sec Residual 1243 keep-boundary;
 * TaskDependencyGraph concatenative; formatTaskDuration Intl; AI formatDurationMs.
 * Does not flip §13.2 checkboxes.
 */
describe('formatScheduleDurationMinutes dual retired (residual 1324)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'format-schedule-duration-minutes.ts'), 'utf8');
  const conflictAlert = readFileSync(
    resolve(dir, '../../modules/schedule/components/ScheduleConflictAlert.vue'),
    'utf8',
  );
  const formDemo = readFileSync(
    resolve(dir, '../../modules/schedule/components/ScheduleFormDemo.vue'),
    'utf8',
  );

  it('owns sole formatScheduleDurationMinutes body (Residual 1324)', () => {
    expect(sole).toContain('Residual 1324');
    expect(sole).toMatch(/export function formatScheduleDurationMinutes\b/);
    const body =
      sole.match(/export function formatScheduleDurationMinutes\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('minutes: number');
    expect(body).toContain("schedule.duration.minutes");
    expect(body).toContain("schedule.duration.hoursMinutes");
    expect(body).toContain("schedule.duration.hours");
    expect(body).toContain('minutes < 60');
  });

  it('retires ScheduleConflictAlert + ScheduleFormDemo dual bodies onto sole', () => {
    expect(conflictAlert).toContain('Residual 1324');
    expect(conflictAlert).toContain('formatScheduleDurationMinutes');
    const cBody =
      conflictAlert.match(/const formatDuration = \([\s\S]*?;/)?.[0] ??
      conflictAlert.match(/const formatDuration = \([\s\S]*?\n\};/)?.[0] ??
      '';
    expect(cBody).toContain('formatScheduleDurationMinutes');
    expect(cBody).not.toContain('schedule.duration.minutes');
    expect(cBody).not.toContain('Math.floor');

    expect(formDemo).toContain('Residual 1324');
    expect(formDemo).toContain('formatScheduleDurationMinutes');
    const dBody = formDemo.match(/function formatDuration\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(dBody).toContain('formatScheduleDurationMinutes');
    expect(dBody).not.toContain('schedule.duration.minutes');
    expect(dBody).not.toContain('Math.floor');
  });

  it('soft residual: ConflictAlert ms floor + presentation durationMs keep-boundary stay separate', () => {
    const conflictMs = readFileSync(
      resolve(dir, '../../modules/schedule/components/ConflictAlert.vue'),
      'utf8',
    );
    const presentation = readFileSync(
      resolve(dir, '../../modules/schedule/utils/schedule-presentation.ts'),
      'utf8',
    );
    expect(conflictMs).toContain('Soft residual 1243');
    const msBody = conflictMs.match(/function formatDuration\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(msBody).toContain('ms / 60000');
    expect(msBody).not.toContain('formatScheduleDurationMinutes');
    expect(presentation).toContain('Residual 1243 keep-boundary');
    expect(presentation).toMatch(/export function formatDuration\b/);
    expect(presentation).toContain('durationMs');
    // Residual 1324 comment may name the minutes sole; body stays durationMs-only
    const pBody = presentation.match(/export function formatDuration\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(pBody).toContain('durationMs');
    expect(pBody).not.toContain('formatScheduleDurationMinutes');
    expect(pBody).not.toContain('schedule.duration.minutes');
  });

  it('runtime: sole maps minutes to schedule.duration.* bands', () => {
    const t = (key: string, params?: Record<string, string | number>) =>
      params ? `${key}:${JSON.stringify(params)}` : key;
    expect(formatScheduleDurationMinutes(30, t)).toContain('schedule.duration.minutes');
    expect(formatScheduleDurationMinutes(120, t)).toContain('schedule.duration.hours');
    expect(formatScheduleDurationMinutes(90, t)).toContain('schedule.duration.hoursMinutes');
    expect(formatScheduleDurationMinutes(90, t)).toContain('"h":1');
    expect(formatScheduleDurationMinutes(90, t)).toContain('"m":30');
  });

  it('documents residual 1324 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'format-schedule-duration-minutes-dual.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1324');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
