import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createComposableHandleError } from './create-composable-handle-error';

/**
 * Residual 973 + 975 + 1055 + 1057 + 1059: createComposableHandleError dual retired.
 * Sole body in create-composable-handle-error.ts.
 * Residual 973: schedule / notification / reminder / setting (default console.error).
 * Residual 975: task instances / templates / dependencies (toast.error via report).
 * Residual 1055: authentication useSession + account useAccount (toast.error via report).
 * Residual 1057: governance useGovernance (default console.error; setGovernanceError dual retired).
 * Residual 1059: dashboard useDashboard (default console.error; local ref error dual retired).
 * Soft residual: usePassword / account checkAvailability toast-only keep-boundary.
 * Does not flip §13.2 checkboxes.
 */
describe('createComposableHandleError dual retired (residual 973/975/1055/1057/1059)', () => {
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
    governance: readFileSync(
      resolve(utilsDir, '../../modules/governance/composables/useGovernance.ts'),
      'utf8',
    ),
    dashboard: readFileSync(
      resolve(utilsDir, '../../modules/dashboard/composables/useDashboard.ts'),
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
  const authAccountToastConsumers = {
    session: readFileSync(
      resolve(utilsDir, '../../modules/authentication/composables/useSession.ts'),
      'utf8',
    ),
    account: readFileSync(
      resolve(utilsDir, '../../modules/account/composables/useAccount.ts'),
      'utf8',
    ),
  } as const;
  const passwordSoft = readFileSync(
    resolve(utilsDir, '../../modules/authentication/composables/usePassword.ts'),
    'utf8',
  );

  it('owns sole createComposableHandleError factory body', () => {
    expect(sole).toContain('Residual 973');
    expect(sole).toContain('Residual 975');
    expect(sole).toContain('Residual 1055');
    expect(sole).toContain('Residual 1057');
    expect(sole).toContain('Residual 1059');
    expect(sole).toMatch(/export function createComposableHandleError\b/);
    expect(sole).toContain('translateResultError');
    expect(sole).toContain('console.error');
    expect(sole).toContain('setError');
    expect(sole).toContain('report');
  });

  it('console cluster imports sole without local dual bodies (residual 973/1057)', () => {
    for (const [label, source] of Object.entries(consoleConsumers)) {
      const residualMarker =
        label === 'governance' ? 'Residual 1057' : label === 'dashboard' ? 'Residual 1059' : 'Residual 973';
      expect(source, label).toContain(residualMarker);
      expect(source, label).toContain(
        "import { createComposableHandleError } from '../../../shared/utils/create-composable-handle-error'",
      );
      expect(source, label).not.toMatch(/function handleError\b/);
      expect(source, label).not.toMatch(/function setGovernanceError\b/);
      expect(source, label).toContain('const handleError = createComposableHandleError');
      expect(source, label).not.toContain('toast.error');
    }
    expect(consoleConsumers.dashboard).not.toContain("console.error('[dashboard]'");
    expect(consoleConsumers.dashboard).not.toContain('translateResultError');
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

  it('auth session + account toast cluster imports sole (residual 1055)', () => {
    for (const [label, source] of Object.entries(authAccountToastConsumers)) {
      expect(source, label).toContain('Residual 1055');
      expect(source, label).toContain(
        "import { createComposableHandleError } from '../../../shared/utils/create-composable-handle-error'",
      );
      expect(source, label).not.toMatch(/function get\w+ErrorMessage\b/);
      expect(source, label).toContain('createComposableHandleError');
      expect(source, label).toContain('report:');
      expect(source, label).toContain('toast.error');
    }
    expect(authAccountToastConsumers.session).toContain('handleLoadError');
    expect(authAccountToastConsumers.session).toContain('handleOperationError');
    expect(authAccountToastConsumers.account).toContain('makeAccountHandleError');
    // soft residual: password keeps toast-only dual path (no setError via sole)
    expect(passwordSoft).not.toContain("from '../../../shared/utils/create-composable-handle-error'");
    expect(passwordSoft).toContain('getPasswordErrorMessage');
    expect(passwordSoft).toContain('Soft residual 1055');
    // soft residual: account checkAvailability toast-only keep-boundary
    expect(authAccountToastConsumers.account).toContain('Soft residual: toast-only');
    expect(authAccountToastConsumers.account).toContain('checkAvailabilityFailed');
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
