import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createComposableHandleError } from './create-composable-handle-error';

/**
 * Residual 973 + 975: createComposableHandleError dual retired.
 * Sole body in create-composable-handle-error.ts.
 * Residual 973: schedule / notification / reminder / setting (default console.error).
 * Residual 975: task instances / templates / dependencies (toast.error via report).
 * Soft residual 988: tip focused suite numbers track Residual 988 evidence tip (284/1244).
 * Does not flip §13.2 checkboxes.
 */
describe('createComposableHandleError dual retired (residual 973/975)', () => {
  const utilsDir = __dirname;
  const sole = readFileSync(resolve(utilsDir, 'create-composable-handle-error.ts'), 'utf8');
  const consoleConsumers = {
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
  const toastConsumers = {
    instances: readFileSync(
      resolve(utilsDir, '../../modules/task/composables/useTaskInstances.ts'),
      'utf8',
    ),
    templates: readFileSync(
      resolve(utilsDir, '../../modules/task/composables/useTaskTemplates.ts'),
      'utf8',
    ),
    dependencies: readFileSync(
      resolve(utilsDir, '../../modules/task/composables/useTaskDependencies.ts'),
      'utf8',
    ),
  } as const;

  it('owns sole createComposableHandleError factory body', () => {
    expect(sole).toContain('Residual 973');
    expect(sole).toContain('Residual 975');
    expect(sole).toMatch(/export function createComposableHandleError\b/);
    expect(sole).toContain('translateResultError');
    expect(sole).toContain('console.error');
    expect(sole).toContain('setError');
    expect(sole).toContain('report');
  });

  it('console cluster imports sole without local dual bodies (residual 973)', () => {
    for (const [label, source] of Object.entries(consoleConsumers)) {
      expect(source, label).toContain('Residual 973');
      expect(source, label).toContain(
        "import { createComposableHandleError } from '../../../shared/utils/create-composable-handle-error'",
      );
      expect(source, label).not.toMatch(/function handleError\b/);
      expect(source, label).toContain('const handleError = createComposableHandleError');
      expect(source, label).not.toContain('toast.error');
    }
  });

  it('task toast cluster imports sole with toast report hook (residual 975)', () => {
    for (const [label, source] of Object.entries(toastConsumers)) {
      expect(source, label).toContain('Residual 975');
      expect(source, label).toContain(
        "import { createComposableHandleError } from '../../../shared/utils/create-composable-handle-error'",
      );
      expect(source, label).not.toMatch(/function handleError\b/);
      expect(source, label).toContain('const handleError = createComposableHandleError');
      expect(source, label).toContain("toast.error(t('task.error.operationFailed')");
      expect(source, label).toContain('report:');
    }
  });

  it('translates, sets error, and reports via default console.error', () => {
    const setError = vi.fn();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const handleError = createComposableHandleError({
      t: (key) => (key === 'x.fail' ? 'translated-fail' : key),
      setError,
    });
    handleError({ code: 'UNKNOWN' }, 'x.fail');
    expect(setError).toHaveBeenCalledWith('translated-fail');
    expect(errorSpy).toHaveBeenCalledWith('translated-fail');
    errorSpy.mockRestore();
  });

  it('uses custom report hook for toast-style paths', () => {
    const setError = vi.fn();
    const report = vi.fn();
    const handleError = createComposableHandleError({
      t: (key) => (key === 'task.error.x' ? 'task-fail' : key),
      setError,
      report,
    });
    handleError({ code: 'UNKNOWN' }, 'task.error.x');
    expect(setError).toHaveBeenCalledWith('task-fail');
    expect(report).toHaveBeenCalledWith('task-fail');
  });
});
