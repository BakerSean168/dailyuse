import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatHHmmParts } from './format-hhmm-parts';

/**
 * Residual 1297: multi-site hour+minute HH:mm padStart dual retired onto formatHHmmParts sole.
 * Residual 1318: sole body padStart dual retired onto padTwoDigits composition.
 * - sole: packages/app-vue/src/shared/utils/format-hhmm-parts.ts
 * - consumers: TaskCapsulePreview, DailyTodoWidget, task-template-presentation, TaskInstanceCard
 * Soft residual: formatLocalHHmm ms sole / formatHour :00 / formatEventTime separators stay separate
 * Does not flip §13.2 checkboxes.
 */
describe('formatHHmmParts dual retired (residual 1297)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'format-hhmm-parts.ts'), 'utf8');
  const capsule = readFileSync(
    resolve(dir, '../../layouts/shell/previews/TaskCapsulePreview.vue'),
    'utf8',
  );
  const daily = readFileSync(
    resolve(dir, '../../modules/task/components/widgets/DailyTodoWidget.vue'),
    'utf8',
  );
  const presentation = readFileSync(
    resolve(dir, '../../modules/task/utils/task-template-presentation.ts'),
    'utf8',
  );
  const instanceCard = readFileSync(
    resolve(dir, '../../modules/task/components/TaskInstanceCard.vue'),
    'utf8',
  );

  it('owns sole formatHHmmParts body (Residual 1297)', () => {
    expect(sole).toContain('Residual 1297');
    expect(sole).toMatch(/export function formatHHmmParts\b/);
    const body = sole.match(/export function formatHHmmParts\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('hour: number');
    expect(body).toContain('minute: number');
    expect(body).toContain('padTwoDigits');
    expect(body).not.toContain('padStart');
  });

  it('retires TaskCapsule / DailyTodo / presentation / TaskInstanceCard dual bodies onto sole', () => {
    expect(capsule).toContain('Residual 1297');
    expect(capsule).toContain('formatHHmmParts');
    const cFmt = capsule.match(/const fmt = \([\s\S]*?\n  \};/)?.[0] ?? '';
    expect(cFmt).toContain('formatHHmmParts');
    expect(cFmt).not.toContain('padStart');

    expect(daily).toContain('Residual 1297');
    expect(daily).toContain('formatHHmmParts');
    const dFmt = daily.match(/const fmt = \([\s\S]*?\n  \};/)?.[0] ?? '';
    expect(dFmt).toContain('formatHHmmParts');
    expect(dFmt).not.toContain('padStart');

    expect(presentation).toContain('Residual 1297');
    expect(presentation).toContain('formatHHmmParts');
    const pBody =
      presentation.match(/function formatMinuteOfDay\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(pBody).toContain('formatHHmmParts');
    expect(pBody).not.toContain('padStart');
    expect(pBody).toContain("return '-'");

    expect(instanceCard).toContain('Residual 1297');
    expect(instanceCard).toContain('formatHHmmParts');
    const iBody = instanceCard.match(/const timeLabel = computed\(\(\) => \{[\s\S]*?\n\}\);/)?.[0] ?? '';
    expect(iBody).toContain('formatHHmmParts');
    expect(iBody).not.toContain('padStart');
  });

  it('soft residual: formatLocalHHmm ms sole and formatHour stay separate', () => {
    const local = readFileSync(resolve(dir, 'format-local-hhmm.ts'), 'utf8');
    const hour = readFileSync(resolve(dir, 'format-hour.ts'), 'utf8');
    expect(local).toContain('formatLocalHHmm');
    expect(local).not.toContain('formatHHmmParts');
    expect(hour).toMatch(/export function formatHour\b/);
    expect(hour).toContain(':00');
    expect(hour).not.toContain('formatHHmmParts');
  });

  it('runtime: formatHHmmParts pads hour and minute', () => {
    expect(formatHHmmParts(9, 5)).toBe('09:05');
    expect(formatHHmmParts(0, 0)).toBe('00:00');
    expect(formatHHmmParts(23, 59)).toBe('23:59');
  });

  it('documents residual 1297 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'format-hhmm-parts-dual.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1297');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
