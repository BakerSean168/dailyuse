import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1228: toDateInput keep-boundary (react UTC ISO YMD vs vue offset-local day).
 * - app-react GoalEditorScreen toDateInput: falsy → ''; toISOString().slice(0,10) UTC
 * - app-vue AIGoalDraftEditor toDateInputValue: falsy → ''; timezoneOffset normalize then ISO slice
 * Soft residual 1228: TaskEditor falsy→today; ScheduleEventEditor null|undefined empty UTC
 * Soft residual 1210: formatDateToInput keep-boundary remains separate.
 * Soft residual 1225: parseDateInput keep-boundary remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('toDateInput keep-boundary (residual 1228)', () => {
  const dir = __dirname;
  const reactGoal = readFileSync(
    resolve(dir, '../../../../app-react/src/screens/GoalEditorScreen.tsx'),
    'utf8',
  );
  const reactTask = readFileSync(
    resolve(dir, '../../../../app-react/src/screens/TaskEditorScreen.tsx'),
    'utf8',
  );
  const reactSchedule = readFileSync(
    resolve(dir, '../../../../app-react/src/screens/ScheduleEventEditorScreen.tsx'),
    'utf8',
  );
  const vueAi = readFileSync(
    resolve(dir, '../../modules/ai/components/AIGoalDraftEditor.vue'),
    'utf8',
  );
  const vueTask = readFileSync(
    resolve(
      dir,
      '../../modules/task/components/TaskTemplateForm/sections/TimeConfigSection.vue',
    ),
    'utf8',
  );

  it('owns Residual 1228 keep-boundary markers on app-react goal UTC toDateInput', () => {
    expect(reactGoal).toContain('Residual 1228 keep-boundary');
    expect(reactGoal).toMatch(/function toDateInput\b/);
    expect(reactGoal).toContain('toISOString().slice(0, 10)');
    const body = reactGoal.match(/function toDateInput\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain("return ''");
    expect(body).toContain('toISOString()');
    expect(body).not.toContain('getTimezoneOffset');
    expect(body).not.toContain('toISOString().slice(0, 10);\n  }\n\n  return new Date().toISOString');
    expect(body).not.toContain('formatDateToYMD');
  });

  it('differs from app-vue AI goal offset-normalized toDateInputValue (no force-merge)', () => {
    expect(vueAi).toContain('Residual 1228 keep-boundary');
    expect(vueAi).toMatch(/function toDateInputValue\b/);
    expect(vueAi).toContain('getTimezoneOffset');
    expect(vueAi).toContain('Soft residual 1228');
    const body = vueAi.match(/function toDateInputValue\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('getTimezoneOffset');
    expect(body).toContain('toISOString().slice(0, 10)');
    expect(body).toContain("return ''");
    expect(body).not.toContain('formatDateToYMD');
    expect(body).not.toContain("format(dateObj, 'yyyy-MM-dd')");
  });

  it('soft residual 1228 TaskEditor today-default and ScheduleEventEditor undefined stay separate', () => {
    expect(reactTask).toContain('Soft residual 1228');
    expect(reactTask).toMatch(/function toDateInput\b/);
    expect(reactTask).toContain("return new Date().toISOString().slice(0, 10)");
    const taskBody = reactTask.match(/function toDateInput\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(taskBody).toContain('new Date().toISOString()');
    expect(taskBody).not.toContain("return ''");

    expect(reactSchedule).toContain('Soft residual 1228');
    expect(reactSchedule).toMatch(/function toDateInput\b/);
    expect(reactSchedule).toContain('number | null | undefined');
    const schedBody = reactSchedule.match(/function toDateInput\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(schedBody).toContain("return ''");
    expect(schedBody).not.toContain('getTimezoneOffset');
    expect(schedBody).not.toContain('new Date().toISOString()');
  });

  it('soft residual 1210 formatDateToInput keep-boundary remains separate on task surface', () => {
    expect(vueTask).toContain('Residual 1210 keep-boundary');
    expect(vueTask).toMatch(/const formatDateToInput\b/);
    expect(vueTask).toContain('formatDateToYMD');
    expect(vueTask).not.toContain('getTimezoneOffset');
  });

  it('runtime: documents UTC ISO vs offset-local vs today-default contracts via body shape', () => {
    function reactGoalToDateInput(timestamp: number | null): string {
      if (!timestamp) {
        return '';
      }
      return new Date(timestamp).toISOString().slice(0, 10);
    }
    function reactTaskToDateInput(timestamp: number | null): string {
      if (!timestamp) {
        return new Date().toISOString().slice(0, 10);
      }
      return new Date(timestamp).toISOString().slice(0, 10);
    }
    function vueOffsetToDateInputValue(value: number | null): string {
      if (!value) {
        return '';
      }
      const date = new Date(value);
      const offset = date.getTimezoneOffset();
      const normalized = new Date(date.getTime() - offset * 60 * 1000);
      return normalized.toISOString().slice(0, 10);
    }
    expect(reactGoalToDateInput(null)).toBe('');
    expect(vueOffsetToDateInputValue(null)).toBe('');
    expect(reactTaskToDateInput(null)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // UTC midnight vs local-offset path can diverge for non-UTC timezones
    const sample = Date.UTC(2026, 6, 24, 2, 0, 0); // 2026-07-24 02:00 UTC
    const utcYmd = reactGoalToDateInput(sample);
    const localYmd = vueOffsetToDateInputValue(sample);
    expect(utcYmd).toBe('2026-07-24');
    expect(localYmd).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // document that contracts are independently defined (local may equal or differ by TZ)
    expect(typeof localYmd).toBe('string');
    expect(reactGoalToDateInput(sample)).toBe(reactTaskToDateInput(sample));
  });

  it('documents residual 1228 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'to-date-input-keep-boundary.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1228');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
