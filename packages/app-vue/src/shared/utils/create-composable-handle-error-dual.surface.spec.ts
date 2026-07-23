import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createComposableHandleError } from './create-composable-handle-error';

/**
 * Residual 973: createComposableHandleError dual retired (console.error path).
 * Sole body in create-composable-handle-error.ts; schedule / notification / reminder /
 * setting composables import it.
 * Soft residual 972: tip focused suite numbers track Residual 972 evidence tip (277/1219).
 * Soft residual: task handleError toast.error path remains keep-boundary
 *   (useTaskInstances / useTaskTemplates / useTaskDependencies).
 * Does not flip §13.2 checkboxes.
 */
describe('createComposableHandleError dual retired (residual 973)', () => {
  const utilsDir = __dirname;
  const sole = readFileSync(resolve(utilsDir, 'create-composable-handle-error.ts'), 'utf8');
  const consumers = {
    schedule: readFileSync(
      resolve(utilsDir, '../../modules/schedule/composables/useScheduleContext.ts'),
      'utf8',
    ),
    notification: readFileSync(
      resolve(utilsDir, '../../modules/notification/composables/useNotification.ts'),
      'utf8',
    ),
    reminder: readFileSync(
      resolve(utilsDir, '../../modules/reminder/composables/useReminderContext.ts'),
      'utf8',
    ),
    setting: readFileSync(
      resolve(utilsDir, '../../modules/setting/composables/useUserSetting.ts'),
      'utf8',
    ),
  } as const;
  const taskToast = readFileSync(
    resolve(utilsDir, '../../modules/task/composables/useTaskInstances.ts'),
    'utf8',
  );

  it('owns sole createComposableHandleError factory body', () => {
    expect(sole).toContain('Residual 973');
    expect(sole).toMatch(/export function createComposableHandleError\b/);
    expect(sole).toContain('translateResultError');
    expect(sole).toContain('console.error');
    expect(sole).toContain('setError');
  });

  it('schedule/notification/reminder/setting import sole without local dual bodies', () => {
    for (const [label, source] of Object.entries(consumers)) {
      expect(source, label).toContain('Residual 973');
      expect(source, label).toContain(
        "import { createComposableHandleError } from '../../../shared/utils/create-composable-handle-error'",
      );
      expect(source, label).not.toMatch(/function handleError\b/);
      expect(source, label).toContain('createComposableHandleError({');
      expect(source, label).toContain('const handleError = createComposableHandleError');
    }
  });

  it('keeps task toast handleError path as distinct keep-boundary', () => {
    expect(taskToast).toMatch(/function handleError\b/);
    expect(taskToast).toContain('toast.error');
    expect(taskToast).not.toContain('create-composable-handle-error');
  });

  it('translates, sets error, and reports via default console.error', () => {
    const setError = vi.fn();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const handleError = createComposableHandleError({
      t: (key) => (key === 'x.fail' ? 'translated-fail' : key),
      setError,
    });
    // Prefer fallbackKey when error lacks a normalized Result message.
    handleError({ code: 'UNKNOWN' }, 'x.fail');
    expect(setError).toHaveBeenCalledWith('translated-fail');
    expect(errorSpy).toHaveBeenCalledWith('translated-fail');
    errorSpy.mockRestore();
  });
});
