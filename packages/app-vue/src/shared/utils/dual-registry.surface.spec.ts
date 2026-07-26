/**
 * Dual registry suite (elegance E3b tax cut).
 * Merged 31 dual-retired surface locks from this directory.
 * Behavior/assertions preserved; individual *-dual.surface.spec.ts removed.
 * Sources: calendar-event-bg-class-dual.surface.spec.ts, calendar-event-source-label-dual.surface.spec.ts, create-composable-handle-error-dual.surface.spec.ts, desktop-auth-status-dual.surface.spec.ts, desktop-bootstrap-api-dual.surface.spec.ts, desktop-detect-name-dual.surface.spec.ts, desktop-environment-name-dual.surface.spec.ts, desktop-host-access-dual.surface.spec.ts, electron-window-desktop-api-dual.surface.spec.ts, format-calendar-event-time-range-dual.surface.spec.ts, format-calendar-event-time-range-local-hhmm-dual.surface.spec.ts, format-date-not-set-dual.surface.spec.ts, format-date-to-ymd-dual.surface.spec.ts, format-date-unknown-dual.surface.spec.ts, format-display-date-dual.surface.spec.ts, format-event-time-local-hhmm-dual.surface.spec.ts, format-hhmm-parts-dual.surface.spec.ts, format-hour-dual.surface.spec.ts, format-local-hhmm-dual.surface.spec.ts, format-schedule-duration-minutes-dual.surface.spec.ts, format-time-dashboard-local-hhmm-dual.surface.spec.ts, get-week-start-dual.surface.spec.ts, handle-absolute-date-select-dual.surface.spec.ts, handle-calendar-select-dual.surface.spec.ts, handle-end-date-calendar-select-dual.surface.spec.ts, pad-two-digits-compose-dual.surface.spec.ts, pad-two-digits-dual.surface.spec.ts, parse-to-date-dual.surface.spec.ts, schedule-form-demo-datetime-local-dual.surface.spec.ts, to-local-date-key-dual.surface.spec.ts, to-local-date-key-pad-two-digits-dual.surface.spec.ts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { calendarEventBgClass, calendarEventSourceLabel, formatCapsuleTime, getWeekStart, toLocalDateKey } from '../../modules/schedule/composables/useCalendarView';
import { createComposableHandleError } from './create-composable-handle-error';
import { formatCalendarEventTimeRange } from './format-calendar-event-time-range';
import { formatDateToYMD } from './format-date-to-ymd';
import { formatDisplayDate } from './format-display-date';
import { formatHHmmParts } from './format-hhmm-parts';
import { formatHour } from './format-hour';
import { formatLocalHHmm } from './format-local-hhmm';
import { formatScheduleDurationMinutes } from './format-schedule-duration-minutes';
import { handleCalendarSelect } from './handle-calendar-select';
import { padTwoDigits } from './pad-two-digits';
import { parseToDate } from './parse-to-date';

// --- merged from calendar-event-bg-class-dual.surface.spec.ts ---
{
  /**
   * Residual 1288: eventBgClass dual retired onto schedule calendarEventBgClass sole.
   * - sole: packages/app-vue/src/modules/schedule/composables/useCalendarView.ts#calendarEventBgClass
   * - consumers: DayViewCalendar + WeekViewCalendar
   * Soft residual 1288: Month eventClass translucent/text variants keep-boundary
   * Soft residual 1288: getEventStyle Day px vs Week % layout keep-boundary
   * Soft residual 1291: sourceLabel dual retired onto calendarEventSourceLabel sole
   * Does not flip §13.2 checkboxes.
   */
  describe('calendarEventBgClass dual retired (residual 1288)', () => {
    const dir = __dirname;
    const sole = readFileSync(
      resolve(dir, '../../modules/schedule/composables/useCalendarView.ts'),
      'utf8',
    );
    const day = readFileSync(
      resolve(dir, '../../modules/schedule/components/DayViewCalendar.vue'),
      'utf8',
    );
    const week = readFileSync(
      resolve(dir, '../../modules/schedule/components/WeekViewCalendar.vue'),
      'utf8',
    );
    const month = readFileSync(
      resolve(dir, '../../modules/schedule/components/MonthViewCalendar.vue'),
      'utf8',
    );

    it('owns sole calendarEventBgClass body (Residual 1288)', () => {
      expect(sole).toContain('Residual 1288');
      expect(sole).toMatch(/export function calendarEventBgClass\b/);
      const body = sole.match(/export function calendarEventBgClass\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(body).toContain('hasConflict');
      expect(body).toContain('bg-warning');
      expect(body).toContain('bg-primary');
      expect(body).toContain('bg-success');
      expect(body).toContain('bg-info');
      expect(body).not.toContain('bg-primary/10');
    });

    it('retires Day/Week eventBgClass dual bodies onto schedule sole', () => {
      for (const [label, source] of [
        ['day', day],
        ['week', week],
      ] as const) {
        expect(source, label).toContain('Residual 1288');
        expect(source, label).toContain('calendarEventBgClass');
        expect(source, label).not.toMatch(/function eventBgClass\b/);
        expect(source, label).not.toMatch(/function calendarEventBgClass\b/);
        expect(source, label).not.toMatch(
          /function eventBgClass\b[\s\S]*?bg-primary/,
        );
      }
    });

    it('soft residual 1288 Month eventClass + Day/Week getEventStyle keep-boundaries', () => {
      expect(month).toMatch(/function eventClass\b/);
      expect(month).toContain('bg-primary/10');
      expect(month).toContain('text-primary');
      // Residual 1306 may mention calendarEventBgClass in keep-boundary comments only
      expect(month).toContain(':class="eventClass(event)"');
      expect(month).not.toContain(':class="calendarEventBgClass(event)"');

      const dayStyle = day.match(/function getEventStyle\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(dayStyle).toContain('px');
      expect(dayStyle).toContain('64');
      expect(dayStyle).not.toContain('%');

      const weekStyle = week.match(/function getEventStyle\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(weekStyle).toContain('%');
      expect(weekStyle).not.toContain('64');
    });

    it('runtime: sole maps conflict and source to solid bg classes', () => {
      expect(calendarEventBgClass({ source: 'schedule', hasConflict: true })).toBe('bg-warning');
      expect(calendarEventBgClass({ source: 'schedule', hasConflict: false })).toBe('bg-primary');
      expect(calendarEventBgClass({ source: 'goal', hasConflict: false })).toBe('bg-success');
      expect(calendarEventBgClass({ source: 'task', hasConflict: false })).toBe('bg-info');
    });

    it('documents residual 1288 lock intent without claiming §13.2 complete', () => {
      const self = readFileSync(resolve(dir, 'dual-registry.surface.spec.ts'), 'utf8');
      expect(self).toContain('Residual 1288');
      expect(self).toContain('Does not flip §13.2 checkboxes');
      expect(self).toContain('dual retired');
    });
  });
}

// --- merged from calendar-event-source-label-dual.surface.spec.ts ---
{
  /**
   * Residual 1291: sourceLabel dual retired onto schedule calendarEventSourceLabel sole.
   * - sole: packages/app-vue/src/modules/schedule/composables/useCalendarView.ts#calendarEventSourceLabel
   * - consumers: DayDetailSheet + EventDetailSheet
   * Soft residual 1294: formatLocalHHmm dual-retired sole (formatCapsuleTime alias) remains separate
   * Soft residual 1288: Month eventClass + getEventStyle Day/Week layout keep-boundaries remain separate
   * Does not flip §13.2 checkboxes.
   */
  describe('calendarEventSourceLabel dual retired (residual 1291)', () => {
    const dir = __dirname;
    const sole = readFileSync(
      resolve(dir, '../../modules/schedule/composables/useCalendarView.ts'),
      'utf8',
    );
    const dayDetail = readFileSync(
      resolve(dir, '../../modules/schedule/components/DayDetailSheet.vue'),
      'utf8',
    );
    const eventDetail = readFileSync(
      resolve(dir, '../../modules/schedule/components/EventDetailSheet.vue'),
      'utf8',
    );

    it('owns sole calendarEventSourceLabel body (Residual 1291)', () => {
      expect(sole).toContain('Residual 1291');
      expect(sole).toMatch(/export function calendarEventSourceLabel\b/);
      const body = sole.match(/export function calendarEventSourceLabel\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(body).toContain('schedule.source.schedule');
      expect(body).toContain('schedule.source.goal');
      expect(body).toContain('schedule.source.task');
      expect(body).toContain('translate(keys[source])');
    });

    it('retires DayDetail + EventDetail sourceLabel dual bodies onto schedule sole', () => {
      for (const [label, source] of [
        ['dayDetail', dayDetail],
        ['eventDetail', eventDetail],
      ] as const) {
        expect(source, label).toContain('Residual 1291');
        expect(source, label).toContain('calendarEventSourceLabel');
        expect(source, label).not.toMatch(/function sourceLabel\b/);
        expect(source, label).not.toMatch(/function calendarEventSourceLabel\b/);
        expect(source, label).not.toMatch(
          /function sourceLabel\b[\s\S]*?schedule\.source\.schedule/,
        );
      }
    });

    it('soft residual 1294 formatLocalHHmm dual-retired sole stays separate from source labels', () => {
      // Residual 1294: formatCapsuleTime is thin alias onto formatLocalHHmm sole.
      expect(sole).toMatch(/export function formatCapsuleTime\b/);
      const cap = sole.match(/export function formatCapsuleTime\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(cap).toContain('formatLocalHHmm');
      expect(cap).not.toContain('schedule.source');
      expect(sole).toContain('Residual 1294');
      const hhmm = readFileSync(resolve(dir, 'format-local-hhmm.ts'), 'utf8');
      expect(hhmm).toContain('Residual 1294');
      expect(hhmm).toContain('@dailyuse/time');
      expect(hhmm).toMatch(/export\s*\{\s*formatLocalHHmm\s*\}/);
      const timeSole = readFileSync(
        resolve(dir, '../../../../time/src/free/format-helpers.ts'),
        'utf8',
      );
      expect(timeSole).toMatch(/export function formatLocalHHmm\b/);
      expect(timeSole).toContain('localHHmm');
    });

    it('runtime: sole maps source keys through translate', () => {
      const translate = (key: string) => `L:${key}`;
      expect(calendarEventSourceLabel('schedule', translate)).toBe('L:schedule.source.schedule');
      expect(calendarEventSourceLabel('goal', translate)).toBe('L:schedule.source.goal');
      expect(calendarEventSourceLabel('task', translate)).toBe('L:schedule.source.task');
    });

    it('documents residual 1291 lock intent without claiming §13.2 complete', () => {
      const self = readFileSync(
        resolve(dir, 'dual-registry.surface.spec.ts'),
        'utf8',
      );
      expect(self).toContain('Residual 1291');
      expect(self).toContain('Does not flip §13.2 checkboxes');
      expect(self).toContain('dual retired');
    });
  });
}

// --- merged from create-composable-handle-error-dual.surface.spec.ts ---
{
  /**
   * Residual 973 + 975 + 1055 + 1057 + 1059: createComposableHandleError dual retired.
   * Sole body in create-composable-handle-error.ts.
   * Residual 973: schedule / notification / reminder / setting (default console.error).
   * Residual 975: task instances / templates / dependencies (toast.error via report).
   * Residual 1055: authentication useSession + account useAccount (toast.error via report).
   * Residual 1057: governance useGovernance (default console.error; setGovernanceError dual retired).
   * Residual 1059: dashboard useDashboard (default console.error; local ref error dual retired).
   * Soft residual: usePassword / account checkAvailability toast-only keep-boundary.
   * Soft residual 1075: password/checkAvailability toast-only keep-boundary surface (no force-merge).
   * Soft residual 1065: goal createGoalErrorHandler rich-log keep-boundary (no force-merge).
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
      // soft residual 1075: password keeps toast-only dual path (no setError via sole)
      expect(passwordSoft).not.toContain("from '../../../shared/utils/create-composable-handle-error'");
      expect(passwordSoft).toContain('getPasswordErrorMessage');
      expect(passwordSoft).toContain('Residual 1075 keep-boundary');
      // soft residual 1075: account checkAvailability toast-only keep-boundary
      expect(authAccountToastConsumers.account).toContain('Residual 1075 keep-boundary');
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
}

// --- merged from desktop-auth-status-dual.surface.spec.ts ---
{
  /**
   * Residual 901: DesktopAuthStatus dual retired.
   * app-vue recovery uses contracts AuthStatus sole body (no local slim dual interface/type).
   * Residual 865 (soft): AuthStatusDTO simplified dual already deleted in contracts protocol.
   * Residual 899 (soft): LoginRequest ≠ EmailLoginCredentials keep-boundary
   *   (apps/desktop .../login-request-email-credentials-keep-boundary.surface.spec.ts).
   * Residual 903 (soft): DesktopBootstrapApi dual retired
   *   (desktop-bootstrap-api-dual.surface.spec.ts).
   * Does not flip §13.2 checkboxes.
   */
  describe('desktop AuthStatus dual retired (residual 901)', () => {
    const utilsDir = __dirname;
    const recovery = readFileSync(resolve(utilsDir, 'desktop-auth-recovery.ts'), 'utf8');
    const contractsAuth = readFileSync(
      resolve(
        utilsDir,
        '../../../../contracts/src/modules/authentication/protocol/desktop-auth.types.ts',
      ),
      'utf8',
    );

    it('recovery imports and uses contracts AuthStatus (no local DesktopAuthStatus dual)', () => {
      expect(recovery).toContain('Residual 901');
      expect(recovery).toContain(
        "import type { AuthStatus } from '@dailyuse/contracts/authentication'",
      );
      expect(recovery).toContain('Promise<AuthStatus | null>');
      expect(recovery).toContain('as IpcResult<AuthStatus>');
      expect(recovery).not.toMatch(/type DesktopAuthStatus\s*=/);
      expect(recovery).not.toMatch(/interface DesktopAuthStatus\b/);
      expect(recovery).not.toContain('IpcResult<DesktopAuthStatus>');
    });

    it('contracts keeps sole AuthStatus body (AuthStatusDTO stays deleted)', () => {
      expect(contractsAuth).toMatch(/export interface AuthStatus\b/);
      expect(contractsAuth).toContain('authenticated: boolean');
      expect(contractsAuth).toContain('runtimeState: AuthRuntimeState');
      expect(contractsAuth).toContain('mode: AuthMode');
      expect(contractsAuth).toContain('user: UserInfo | null');
      expect(contractsAuth).toContain('session: SessionInfo | null');
      expect(contractsAuth).not.toMatch(/export interface AuthStatusDTO\b/);
      expect(contractsAuth).not.toContain('export type AuthStatusDTO = AuthStatus');
      // Residual 865 pointer still present
      expect(contractsAuth).toContain('Residual 865');
    });

    it('AuthBootstrapSnapshot composes AuthStatus (sole status field type)', () => {
      expect(contractsAuth).toMatch(/export interface AuthBootstrapSnapshot\b/);
      expect(contractsAuth).toContain('status: AuthStatus');
      expect(contractsAuth).not.toContain('status: AuthStatusDTO');
      expect(contractsAuth).not.toContain('status: DesktopAuthStatus');
    });
  });
}

// --- merged from desktop-bootstrap-api-dual.surface.spec.ts ---
{
  /**
   * Residual 903: DesktopBootstrapApi dual retired (type alias of DesktopAuthApi).
   * Residual 919: DesktopBootstrapApi name fully retired — hydrate uses DesktopAuthApi sole body.
   * Residual 901 (soft): DesktopAuthStatus dual retired
   *   (desktop-auth-status-dual.surface.spec.ts).
   * Residual 905 (soft): reminder DesktopApi dual retired
   *   (modules/reminder/.../reminder-desktop-api-dual.surface.spec.ts).
   * Residual 909 (soft): Window.electronAPI + desktop-detect duals retired
   *   (electron-window-desktop-api-dual.surface.spec.ts).
   * Does not flip §13.2 checkboxes.
   */
  describe('desktop DesktopBootstrapApi dual retired (residual 903/919)', () => {
    const utilsDir = __dirname;
    const bootstrap = readFileSync(resolve(utilsDir, 'desktop-bootstrap-auth.ts'), 'utf8');
    const recovery = readFileSync(resolve(utilsDir, 'desktop-auth-recovery.ts'), 'utf8');

    it('drops DesktopBootstrapApi name and hydrates with DesktopAuthApi sole body', () => {
      expect(bootstrap).toContain('Residual 903');
      expect(bootstrap).toContain('Residual 919');
      expect(bootstrap).toContain(
        "import type { DesktopAuthApi } from './desktop-auth-recovery'",
      );
      expect(bootstrap).toContain('api?: DesktopAuthApi');
      expect(bootstrap).not.toMatch(/export type DesktopBootstrapApi\b/);
      expect(bootstrap).not.toMatch(/export interface DesktopBootstrapApi\b/);
      expect(bootstrap).not.toMatch(/api\?: DesktopBootstrapApi\b/);
    });

    it('keeps sole DesktopAuthApi object-type body in recovery module', () => {
      expect(recovery).toContain('Residual 903');
      expect(recovery).toContain('Residual 919');
      expect(recovery).toMatch(/export type DesktopAuthApi = \{/);
      expect(recovery).toContain(
        'invoke?: (channel: string, ...args: unknown[]) => Promise<unknown>',
      );
      expect(recovery).not.toContain('export type DesktopAuthApi = DesktopBootstrapApi');
    });

    it('bootstrap hydrate still owns GET_BOOTSTRAP_SNAPSHOT IpcResult path', () => {
      expect(bootstrap).toContain(
        'export async function hydrateDesktopBootstrapAuthState',
      );
      expect(bootstrap).toContain('AuthChannels.GET_BOOTSTRAP_SNAPSHOT');
      expect(bootstrap).toContain('IpcResult<AuthBootstrapSnapshot>');
    });
  });
}

// --- merged from desktop-detect-name-dual.surface.spec.ts ---
{
  /**
   * Residual 919: remaining desktop-detect / bootstrap-api name duals retired.
   * - hydrateDesktopBootstrapAuthState accepts DesktopAuthApi (no DesktopBootstrapApi name).
   * - router guards use hasDesktopAuthApi directly (no hasDesktopElectronBridge wrapper).
   * Residual 903 (soft): DesktopBootstrapApi dual retired path
   *   (desktop-bootstrap-api-dual.surface.spec.ts).
   * Residual 909 (soft): Window typing + hasDesktopAuthApi detect
   *   (electron-window-desktop-api-dual.surface.spec.ts).
   * Residual 923 (soft): isDesktopEnvironment name dual retired
   *   (desktop-environment-name-dual.surface.spec.ts).
   * Does not flip §13.2 checkboxes.
   */
  describe('desktop detect/bootstrap name duals retired (residual 919)', () => {
    const utilsDir = __dirname;
    const bootstrap = readFileSync(resolve(utilsDir, 'desktop-bootstrap-auth.ts'), 'utf8');
    const recovery = readFileSync(resolve(utilsDir, 'desktop-auth-recovery.ts'), 'utf8');
    const guards = readFileSync(resolve(utilsDir, '../../router/guards.ts'), 'utf8');

    it('hydrate uses DesktopAuthApi sole param type (no DesktopBootstrapApi export)', () => {
      expect(bootstrap).toContain('Residual 919');
      expect(bootstrap).toContain('api?: DesktopAuthApi');
      expect(bootstrap).not.toMatch(/export type DesktopBootstrapApi\b/);
      expect(bootstrap).not.toMatch(/api\?: DesktopBootstrapApi\b/);
    });

    it('router guards detect desktop via hasDesktopAuthApi without name-wrapper dual', () => {
      expect(guards).toContain('Residual 919');
      expect(guards).toContain(
        "import { hasDesktopAuthApi } from '../shared/utils/desktop-auth-recovery'",
      );
      expect(guards).toContain('hasDesktopAuthApi(window)');
      expect(guards).not.toMatch(/function hasDesktopElectronBridge\b/);
      expect(guards).not.toContain('hasDesktopElectronBridge(');
    });

    it('keeps sole hasDesktopAuthApi helper and DesktopAuthApi body in recovery', () => {
      expect(recovery).toContain('Residual 919');
      expect(recovery).toContain('export function hasDesktopAuthApi');
      expect(recovery).toMatch(/export type DesktopAuthApi = \{/);
      expect(recovery).toContain(
        'invoke?: (channel: string, ...args: unknown[]) => Promise<unknown>',
      );
    });
  });
}

// --- merged from desktop-environment-name-dual.surface.spec.ts ---
{
  /**
   * Residual 923: isDesktopEnvironment name dual fully retired.
   * Residual 1045 (soft): login/register/remembered desktop detect moved into
   * completeAuthSuccess sole; guest still detects via hasDesktopAuthApi(window).
   * Residual 909 (soft): Window typing + hasDesktopAuthApi detect
   *   (electron-window-desktop-api-dual.surface.spec.ts).
   * Residual 919 (soft): hasDesktopElectronBridge wrapper retired
   *   (desktop-detect-name-dual.surface.spec.ts).
   * Does not flip §13.2 checkboxes.
   */
  describe('desktop isDesktopEnvironment name dual retired (residual 923)', () => {
    const utilsDir = __dirname;
    const authDir = resolve(utilsDir, '../../modules/authentication/composables');
    const authContext = readFileSync(resolve(authDir, 'useAuthContext.ts'), 'utf8');
    const useLogin = readFileSync(resolve(authDir, 'useLogin.ts'), 'utf8');
    const useRegister = readFileSync(resolve(authDir, 'useRegister.ts'), 'utf8');
    const useRemembered = readFileSync(resolve(authDir, 'useRememberedAccounts.ts'), 'utf8');
    const useGuest = readFileSync(resolve(authDir, 'useGuestMode.ts'), 'utf8');
    const completeAuth = readFileSync(resolve(authDir, 'completeAuthSuccess.ts'), 'utf8');
    const recovery = readFileSync(resolve(utilsDir, 'desktop-auth-recovery.ts'), 'utf8');

    it('drops isDesktopEnvironment export from useAuthContext', () => {
      expect(authContext).toContain('Residual 923');
      expect(authContext).not.toMatch(/export const isDesktopEnvironment\b/);
      expect(authContext).not.toMatch(/function isDesktopEnvironment\b/);
      expect(authContext).not.toMatch(/isDesktopEnvironment\s*\(/);
    });

    it('auth composables detect desktop via hasDesktopAuthApi without name dual', () => {
      // Residual 1045: post-auth success path uses sole completeAuthSuccess (hasDesktopAuthApi inside).
      for (const [name, source] of [
        ['useLogin', useLogin],
        ['useRegister', useRegister],
        ['useRememberedAccounts', useRemembered],
      ] as const) {
        expect(source, name).toContain('Residual 923');
        expect(source, name).toContain('Residual 1045');
        expect(source, name).toContain("from './completeAuthSuccess'");
        expect(source, name).toContain('completeAuthSuccess(');
        expect(source, name).not.toMatch(/async function completeAuthSuccess\b/);
        expect(source, name).not.toContain('hasDesktopAuthApi(window)');
        expect(source, name).not.toMatch(/export const isDesktopEnvironment\b/);
        expect(source, name).not.toMatch(/function isDesktopEnvironment\b/);
        expect(source, name).not.toMatch(/isDesktopEnvironment\s*\(/);
        expect(source, name).not.toMatch(
          /import\s*\{[^}]*isDesktopEnvironment[^}]*\}\s*from\s*['"]\.\/useAuthContext['"]/,
        );
      }

      expect(completeAuth).toContain('Residual 1045');
      expect(completeAuth).toContain('hasDesktopAuthApi(window)');
      expect(completeAuth).toContain(
        "from '../../../shared/utils/desktop-auth-recovery'",
      );

      // Guest still detects desktop directly via hasDesktopAuthApi.
      expect(useGuest).toContain('Residual 923');
      expect(useGuest).toContain('hasDesktopAuthApi(window)');
      expect(useGuest).toContain(
        "from '../../../shared/utils/desktop-auth-recovery'",
      );
      expect(useGuest).not.toMatch(/export const isDesktopEnvironment\b/);
      expect(useGuest).not.toMatch(/function isDesktopEnvironment\b/);
      expect(useGuest).not.toMatch(/isDesktopEnvironment\s*\(/);
      expect(useGuest).not.toMatch(
        /import\s*\{[^}]*isDesktopEnvironment[^}]*\}\s*from\s*['"]\.\/useAuthContext['"]/,
      );

      // type-only AuthContext imports remain
      expect(useLogin).toContain("import type { AuthContext } from './useAuthContext'");
      expect(useGuest).toContain("import type { AuthContext } from './useAuthContext'");
    });

    it('keeps sole hasDesktopAuthApi helper in recovery', () => {
      expect(recovery).toContain('Residual 923');
      expect(recovery).toContain('export function hasDesktopAuthApi');
      expect(recovery).toContain(
        'invoke?: (channel: string, ...args: unknown[]) => Promise<unknown>',
      );
      expect(recovery).not.toMatch(/export const isDesktopEnvironment\b/);
      expect(recovery).not.toMatch(/function isDesktopEnvironment\b/);
      expect(recovery).not.toMatch(/isDesktopEnvironment\s*\(/);
    });
  });
}

// --- merged from desktop-host-access-dual.surface.spec.ts ---
{
  /**
   * Residual 913: remaining app-vue host-access cast duals retired.
   * useGuestMode / useThemeSync / AppShell use getDesktopAuthApi or hasDesktopAuthApi
   * (no inline Window & electronAPI / DesktopBootstrapApi cast duals).
   * Keep-boundary: useDesktopWindowControls still needs ElectronBridge (invoke+on+off).
   * Residual 929 (soft): ElectronBridge window-controls keep-boundary locked
   *   (../composables/use-desktop-window-controls.surface.spec.ts).
   * Residual 909 (soft): Window typing + detect duals retired
   *   (electron-window-desktop-api-dual.surface.spec.ts).
   * Residual 907 (soft): themeSync DesktopAuthApi dual retired
   *   (modules/setting/.../theme-sync-desktop-api-dual.surface.spec.ts).
   * Residual 923 (soft): isDesktopEnvironment name dual retired
   *   (desktop-environment-name-dual.surface.spec.ts).
   * Does not flip §13.2 checkboxes.
   */
  describe('desktop host-access dual retired (residual 913)', () => {
    const utilsDir = __dirname;
    const recovery = readFileSync(resolve(utilsDir, 'desktop-auth-recovery.ts'), 'utf8');
    const guest = readFileSync(
      resolve(utilsDir, '../../modules/authentication/composables/useGuestMode.ts'),
      'utf8',
    );
    const themeSync = readFileSync(
      resolve(utilsDir, '../../modules/setting/composables/useThemeSync.ts'),
      'utf8',
    );
    const shell = readFileSync(resolve(utilsDir, '../../layouts/shell/AppShell.vue'), 'utf8');
    const windowControls = readFileSync(
      resolve(utilsDir, '../composables/useDesktopWindowControls.ts'),
      'utf8',
    );

    it('useGuestMode hydrates via getDesktopAuthApi (no DesktopBootstrapApi cast dual)', () => {
      expect(guest).toContain('Residual 913');
      expect(guest).toContain('Residual 923');
      expect(guest).toMatch(
        /import\s*\{[\s\S]*getDesktopAuthApi[\s\S]*\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/shared\/utils\/desktop-auth-recovery['"]/,
      );
      expect(guest).toContain('getDesktopAuthApi');
      expect(guest).toContain('hasDesktopAuthApi');
      expect(guest).toContain('hydrateDesktopBootstrapAuthState(getDesktopAuthApi(window))');
      expect(guest).not.toMatch(/import type \{ DesktopBootstrapApi\b/);
      expect(guest).not.toMatch(/electronAPI\?: DesktopBootstrapApi/);
      expect(guest).not.toMatch(/as unknown as \{\s*electronAPI\?/);
    });

    it('useThemeSync and AppShell use recovery host helpers (no Window cast duals)', () => {
      expect(themeSync).toContain('Residual 913');
      expect(themeSync).toContain(
        "import { getDesktopAuthApi } from '../../../shared/utils/desktop-auth-recovery'",
      );
      expect(themeSync).toContain('getDesktopAuthApi(window)?.invoke?.(');
      expect(themeSync).not.toMatch(/Window\s*&\s*\{\s*electronAPI\?/);

      expect(shell).toContain('Residual 913');
      expect(shell).toContain(
        "import { hasDesktopAuthApi } from '../../shared/utils/desktop-auth-recovery'",
      );
      expect(shell).toContain('hasDesktopAuthApi(window)');
      expect(shell).not.toMatch(/electronAPI\?:\s*unknown/);
    });

    it('keeps getDesktopAuthApi/hasDesktopAuthApi sole helpers; ElectronBridge keep-boundary for window controls', () => {
      expect(recovery).toContain('Residual 913');
      expect(recovery).toContain('export function getDesktopAuthApi');
      expect(recovery).toContain('export function hasDesktopAuthApi');
      expect(recovery).toMatch(/export type DesktopAuthApi = \{/);
      expect(windowControls).toContain('Residual 929');
      expect(windowControls).toContain('ElectronBridge');
      expect(windowControls).toContain('DESKTOP_BRIDGE_KEY');
      expect(windowControls).toContain('function isElectronBridge');
    });
  });
}

// --- merged from electron-window-desktop-api-dual.surface.spec.ts ---
{
  /**
   * Residual 909: app-vue Window.electronAPI + desktop-detect duals retired.
   * Window typing and detect helpers use DesktopAuthApi sole invoke-api body.
   * Keep-boundary: host apps/desktop env.d.ts keeps ElectronBridge (invoke+on+off).
   * Residual 907 (soft): themeSync electronAPI dual retired
   *   (modules/setting/.../theme-sync-desktop-api-dual.surface.spec.ts).
   * Residual 905 (soft): reminder DesktopApi dual retired
   *   (modules/reminder/.../reminder-desktop-api-dual.surface.spec.ts).
   * Residual 913 (soft): host-access cast duals retired
   *   (desktop-host-access-dual.surface.spec.ts).
   * Residual 919 (soft): DesktopBootstrapApi name + hasDesktopElectronBridge wrapper retired
   *   (desktop-detect-name-dual.surface.spec.ts).
   * Residual 923 (soft): isDesktopEnvironment name dual retired
   *   (desktop-environment-name-dual.surface.spec.ts).
   * Does not flip §13.2 checkboxes.
   */
  describe('electron window DesktopAuthApi dual retired (residual 909)', () => {
    const utilsDir = __dirname;
    const electronDts = readFileSync(resolve(utilsDir, '../types/electron.d.ts'), 'utf8');
    const recovery = readFileSync(resolve(utilsDir, 'desktop-auth-recovery.ts'), 'utf8');
    const authContext = readFileSync(
      resolve(utilsDir, '../../modules/authentication/composables/useAuthContext.ts'),
      'utf8',
    );
    const guards = readFileSync(resolve(utilsDir, '../../router/guards.ts'), 'utf8');

    it('types Window.electronAPI as DesktopAuthApi (no inline dual body)', () => {
      expect(electronDts).toContain('Residual 909');
      expect(electronDts).toContain(
        "import type { DesktopAuthApi } from '../utils/desktop-auth-recovery'",
      );
      expect(electronDts).toContain('electronAPI?: DesktopAuthApi');
      expect(electronDts).not.toMatch(
        /electronAPI\?:\s*\{\s*invoke\(?channel:\s*string/,
      );
      expect(electronDts).not.toMatch(/electronAPI\?:\s*ElectronBridge/);
      expect(electronDts).toContain('Keep-boundary vs host ElectronBridge');
    });

    it('owns hasDesktopAuthApi helper and keeps sole DesktopAuthApi body in recovery', () => {
      expect(recovery).toContain('Residual 909');
      expect(recovery).toMatch(/export type DesktopAuthApi = \{/);
      expect(recovery).toContain(
        'invoke?: (channel: string, ...args: unknown[]) => Promise<unknown>',
      );
      expect(recovery).toContain('export function hasDesktopAuthApi');
      expect(recovery).toContain("typeof getDesktopAuthApi(host)?.invoke === 'function'");
    });

    it('auth context retires isDesktopEnvironment; router guards detect via hasDesktopAuthApi', () => {
      expect(authContext).toContain('Residual 909');
      expect(authContext).toContain('Residual 923');
      expect(authContext).not.toMatch(/export const isDesktopEnvironment\b/);
      expect(authContext).not.toMatch(/electronAPI\?:\s*\{\s*invoke\?/);

      expect(guards).toContain('Residual 909');
      expect(guards).toContain(
        "import { hasDesktopAuthApi } from '../shared/utils/desktop-auth-recovery'",
      );
      expect(guards).toContain('hasDesktopAuthApi(window)');
      expect(guards).not.toMatch(/electronAPI\?:\s*\{\s*invoke\?/);
    });
  });
}

// --- merged from format-calendar-event-time-range-dual.surface.spec.ts ---
{
  /**
   * Residual 1273: formatCalendarEventTimeRange dual retired onto app-vue shared sole.
   * - sole: packages/app-vue/src/shared/utils/format-calendar-event-time-range.ts
   * - consumers: DayDetailSheet + TaskEventActionPanel (was identical local formatTimeRange)
   * Soft residual 1213: app-react useScheduleAgenda Intl zh-CN pair keep-boundary remains separate.
   * Residual 1303: inner HH:mm dual retired onto formatLocalHHmm (en-dash range contract remains).
   * Does not flip §13.2 checkboxes.
   */
  describe('formatCalendarEventTimeRange dual retired (residual 1273)', () => {
    const dir = __dirname;
    const sole = readFileSync(resolve(dir, 'format-calendar-event-time-range.ts'), 'utf8');
    const day = readFileSync(
      resolve(dir, '../../modules/schedule/components/DayDetailSheet.vue'),
      'utf8',
    );
    const panel = readFileSync(
      resolve(dir, '../../modules/schedule/components/TaskEventActionPanel.vue'),
      'utf8',
    );
    const react = readFileSync(
      resolve(dir, '../../../../app-react/src/hooks/useScheduleAgenda.ts'),
      'utf8',
    );

    it('owns sole formatCalendarEventTimeRange body (Residual 1273)', () => {
      expect(sole).toContain('Residual 1273');
      expect(sole).toMatch(/export function formatCalendarEventTimeRange\b/);
      expect(sole).toContain("displayMode === 'all-day'");
      expect(sole).toContain('formatLocalHHmm');
      expect(sole).not.toContain('padStart');
      expect(sole).toContain('–');
      const body = sole.match(/export function formatCalendarEventTimeRange\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(body).toContain('allDayLabel');
      expect(body).toContain('formatLocalHHmm');
      expect(body).not.toContain('Intl.DateTimeFormat');
      expect(body).not.toContain('zh-CN');
    });

    it('retires DayDetail/Panel dual bodies onto shared sole', () => {
      for (const [label, source] of [
        ['day', day],
        ['panel', panel],
      ] as const) {
        expect(source, label).toContain('Residual 1273');
        expect(source, label).toContain('format-calendar-event-time-range');
        expect(source, label).toContain('formatCalendarEventTimeRange');
        expect(source, label).toMatch(/function formatTimeRange\b/);
        const body = source.match(/function formatTimeRange\([\s\S]*?\n\}/)?.[0] ?? '';
        expect(body, label).toContain('formatCalendarEventTimeRange');
        expect(body, label).not.toContain('padStart');
        expect(body, label).not.toContain('instanceof Date');
      }
    });

    it('soft residual 1213 app-react Intl pair keep-boundary stays separate', () => {
      expect(react).toContain('Residual 1213 keep-boundary');
      expect(react).toMatch(/function formatTimeRange\b/);
      expect(react).toContain("Intl.DateTimeFormat('zh-CN'");
      expect(react).not.toContain('format-calendar-event-time-range');
      expect(react).not.toContain('formatCalendarEventTimeRange');
    });

    it('runtime: sole all-day label and en-dash range', () => {
      const start = new Date(2026, 6, 24, 9, 5, 0).getTime();
      const end = new Date(2026, 6, 24, 10, 30, 0).getTime();
      expect(
        formatCalendarEventTimeRange(
          { displayMode: 'all-day', startTime: start, endTime: end },
          '整天',
        ),
      ).toBe('整天');
      expect(formatCalendarEventTimeRange({ startTime: start, endTime: end }, '整天')).toBe(
        '09:05 – 10:30',
      );
    });

    it('documents residual 1273 lock intent without claiming §13.2 complete', () => {
      const self = readFileSync(
        resolve(dir, 'dual-registry.surface.spec.ts'),
        'utf8',
      );
      expect(self).toContain('Residual 1273');
      expect(self).toContain('Does not flip §13.2 checkboxes');
      expect(self).toContain('dual retired');
    });
  });
}

// --- merged from format-calendar-event-time-range-local-hhmm-dual.surface.spec.ts ---
{
  /**
   * Residual 1303: formatCalendarEventTimeRange inner HH:mm dual retired onto formatLocalHHmm sole.
   * Residual 1273 en-dash range sole + DayDetail/Panel consumers remain; only padStart body retires.
   * Soft residual: Month eventClass translucent/text vs calendarEventBgClass solid; getEventStyle Day px vs Week %.
   * Does not flip §13.2 checkboxes.
   */
  describe('formatCalendarEventTimeRange → formatLocalHHmm dual retired (residual 1303)', () => {
    const dir = __dirname;
    const sole = readFileSync(resolve(dir, 'format-calendar-event-time-range.ts'), 'utf8');
    const local = readFileSync(resolve(dir, 'format-local-hhmm.ts'), 'utf8');

    it('owns Residual 1303 composition of formatCalendarEventTimeRange onto formatLocalHHmm', () => {
      expect(sole).toContain('Residual 1303');
      expect(sole).toContain('formatLocalHHmm');
      expect(sole).toContain('–');
      expect(sole).toMatch(/export function formatCalendarEventTimeRange\b/);
      const body = sole.match(/export function formatCalendarEventTimeRange\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(body).toContain('formatLocalHHmm');
      expect(body).not.toContain('padStart');
      expect(body).not.toContain('getHours');
      expect(local).toContain('@dailyuse/time');
      expect(local).toMatch(/export\s*\{\s*formatLocalHHmm\s*\}/);
    });

    it('keeps Residual 1273 en-dash sole contract + DayDetail/Panel consumers', () => {
      expect(sole).toContain('Residual 1273');
      const day = readFileSync(
        resolve(dir, '../../modules/schedule/components/DayDetailSheet.vue'),
        'utf8',
      );
      const panel = readFileSync(
        resolve(dir, '../../modules/schedule/components/TaskEventActionPanel.vue'),
        'utf8',
      );
      expect(day).toContain('formatCalendarEventTimeRange');
      expect(panel).toContain('formatCalendarEventTimeRange');
    });

    it('soft residual: Month eventClass + Day/Week getEventStyle keep-boundaries stay separate', () => {
      const month = readFileSync(
        resolve(dir, '../../modules/schedule/components/MonthViewCalendar.vue'),
        'utf8',
      );
      const day = readFileSync(
        resolve(dir, '../../modules/schedule/components/DayViewCalendar.vue'),
        'utf8',
      );
      const week = readFileSync(
        resolve(dir, '../../modules/schedule/components/WeekViewCalendar.vue'),
        'utf8',
      );
      expect(month).toMatch(/function eventClass\b/);
      expect(month).toContain('bg-warning/15');
      expect(month).toContain(':class="eventClass(event)"');
      expect(month).not.toContain(':class="calendarEventBgClass(event)"');
      const dayStyle = day.match(/function getEventStyle\([\s\S]*?\n\}/)?.[0] ?? '';
      const weekStyle = week.match(/function getEventStyle\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(dayStyle).toContain('64');
      expect(dayStyle).toContain('px');
      expect(weekStyle).toContain('%');
      expect(weekStyle).not.toContain('64');
    });

    it('runtime: range sole agrees with formatLocalHHmm + en-dash', () => {
      const start = new Date(2026, 6, 24, 9, 5, 0).getTime();
      const end = new Date(2026, 6, 24, 10, 30, 0).getTime();
      expect(formatLocalHHmm(start)).toBe('09:05');
      expect(formatLocalHHmm(end)).toBe('10:30');
      expect(formatCalendarEventTimeRange({ startTime: start, endTime: end }, '整天')).toBe(
        '09:05 – 10:30',
      );
      expect(
        formatCalendarEventTimeRange(
          { displayMode: 'all-day', startTime: start, endTime: end },
          '整天',
        ),
      ).toBe('整天');
    });

    it('documents residual 1303 lock intent without claiming §13.2 complete', () => {
      const self = readFileSync(
        resolve(dir, 'dual-registry.surface.spec.ts'),
        'utf8',
      );
      expect(self).toContain('Residual 1303');
      expect(self).toContain('Does not flip §13.2 checkboxes');
      expect(self).toContain('dual retired');
    });
  });
}

// --- merged from format-date-not-set-dual.surface.spec.ts ---
{
  /**
   * Residual 1261: formatDateNotSet dual retired onto app-react shared sole.
   * - sole: packages/app-react/src/utils/format-date-not-set.ts (@dailyuse/time date + English 'Not set')
   * - consumers: AccountScreen + GoalDetailScreen
   * Soft residual 1261 / 1240:
   * - TaskDetailScreen: time.format.dateTime + empty.display 'Not set'
   * - GoalCompareScreen: time.format.date + empty.display '-' (Residual 1240 keep-boundary)
   * - formatDateUnknown dual-retired sole (Residual 1264) remains separate
   * Soft residual 1240: vue goal i18n notSet / schedule N/A remain separate.
   * Soft residual 1258: handleCalendarSelect dual-retired sole remains separate.
   * Does not flip §13.2 checkboxes.
   */
  describe('formatDateNotSet dual retired (residual 1261)', () => {
    const dir = __dirname;
    const reactUtils = resolve(dir, '../../../../app-react/src/utils');
    const reactScreens = resolve(dir, '../../../../app-react/src/screens');
    const sole = readFileSync(resolve(reactUtils, 'format-date-not-set.ts'), 'utf8');
    const account = readFileSync(resolve(reactScreens, 'AccountScreen.tsx'), 'utf8');
    const goalDetail = readFileSync(resolve(reactScreens, 'GoalDetailScreen.tsx'), 'utf8');
    const taskDetail = readFileSync(resolve(reactScreens, 'TaskDetailScreen.tsx'), 'utf8');
    const goalCompare = readFileSync(resolve(reactScreens, 'GoalCompareScreen.tsx'), 'utf8');

    it('owns sole formatDateNotSet body (Residual 1261)', () => {
      expect(sole).toContain('Residual 1261');
      expect(sole).toMatch(/export function formatDateNotSet\b/);
      expect(sole).toContain("emptyKind('notSet')");
      expect(sole).toContain('formatProductDate');
      expect(sole).toContain('product-time');
      const body = sole.match(/export function formatDateNotSet\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(body).toContain('timestamp: number | null');
      expect(body).toContain('formatProductDate');
      expect(body).not.toContain('createTimeFacade');
      expect(body).not.toContain('toLocaleString()');
      expect(body).not.toContain("return '-'");
      expect(body).not.toContain("'Unknown'");
    });

    it('retires Account/GoalDetail dual bodies onto shared sole', () => {
      for (const [label, source] of [
        ['account', account],
        ['goalDetail', goalDetail],
      ] as const) {
        expect(source, label).toContain('Residual 1261');
        expect(source, label).toContain('format-date-not-set');
        expect(source, label).toContain('formatDateNotSet');
        expect(source, label).not.toMatch(/function formatDate\b/);
        expect(source, label).not.toMatch(
          /function formatDate\b[\s\S]*?'Not set'[\s\S]*?toLocaleDateString/,
        );
      }
    });

    it('soft residual 1261 task datetime Not set + goal compare dash stay separate', () => {
      expect(taskDetail).toContain("emptyKind('notSet')");
      expect(taskDetail).toContain('formatProductDateTime');
      expect(taskDetail).not.toMatch(/function formatDate\b/);
      expect(taskDetail).not.toContain('createTimeFacade');
      expect(taskDetail).not.toContain('format-date-not-set');

      expect(goalCompare).toContain("emptyKind('dash')");
      expect(goalCompare).toContain('formatProductDate');
      expect(goalCompare).not.toMatch(/function formatDate\b/);
      expect(goalCompare).not.toContain('createTimeFacade');
      expect(goalCompare).not.toContain('format-date-not-set');
    });

    it('documents residual 1261 lock intent without claiming §13.2 complete', () => {
      const self = readFileSync(resolve(dir, 'dual-registry.surface.spec.ts'), 'utf8');
      expect(self).toContain('Residual 1261');
      expect(self).toContain('Does not flip §13.2 checkboxes');
      expect(self).toContain('dual retired');
    });
  });
}

// --- merged from format-date-to-ymd-dual.surface.spec.ts ---
{
  /**
   * Residual 1252: formatDateToYMD dual retired onto app-vue shared sole.
   * Residual 1318: sole body padStart dual retired onto padTwoDigits composition.
   * - sole: packages/app-vue/src/shared/utils/format-date-to-ymd.ts
   * - consumers: CreateScheduleDialog, TimeConfigSection, ReminderSection; Recurrence via handleCalendarSelect (Residual 1267)
   * Soft residual 1252/1255: parseToDate dual retired onto shared sole in residual 1255.
   * Soft residual 1249: formatDisplayDate dual-retired sole remains separate.
   * Soft residual 1240: formatDate keep-boundary remains separate (timestamp display).
   * Soft residual 1282: calendar toDateStr dual retired onto toLocalDateKey (Date|number); Date-only form sole stays separate.
   * Does not flip §13.2 checkboxes.
   */
  describe('formatDateToYMD dual retired (residual 1252)', () => {
    const dir = __dirname;
    const sole = readFileSync(resolve(dir, 'format-date-to-ymd.ts'), 'utf8');
    const schedule = readFileSync(
      resolve(dir, '../../modules/schedule/components/CreateScheduleDialog.vue'),
      'utf8',
    );
    const timeConfig = readFileSync(
      resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/TimeConfigSection.vue'),
      'utf8',
    );
    const reminder = readFileSync(
      resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/ReminderSection.vue'),
      'utf8',
    );
    const recurrence = readFileSync(
      resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/RecurrenceSection.vue'),
      'utf8',
    );

    it('owns sole formatDateToYMD body (Residual 1252 / ADR-037 W2 → @dailyuse/time)', () => {
      expect(sole).toContain('Residual 1252');
      expect(sole).toContain("@dailyuse/time");
      expect(sole).toMatch(/export\s*\{\s*formatDateToYMD\s*\}/);
      const timeSole = readFileSync(
        resolve(dir, '../../../../time/src/free/format-helpers.ts'),
        'utf8',
      );
      expect(timeSole).toMatch(/export function formatDateToYMD\b/);
      expect(timeSole).toContain('dateToYmd');
    });

    it('retires schedule/task dual bodies onto shared sole', () => {
      for (const [label, source] of [
        ['schedule', schedule],
        ['timeConfig', timeConfig],
        ['reminder', reminder],
      ] as const) {
        expect(source, label).toContain('Residual 1252');
        expect(source, label).toContain('format-date-to-ymd');
        expect(source, label).toContain('formatDateToYMD');
        expect(source, label).not.toMatch(/function formatDateToYMD\b/);
        expect(source, label).not.toMatch(
          /function formatDateToYMD\b[\s\S]*?getFullYear/,
        );
      }
      // Residual 1267: Recurrence endDate calendar uses handleCalendarSelect (formatDateToYMD via sole).
      expect(recurrence).toContain('Residual 1252');
      expect(recurrence).toContain('formatDateToYMD dual retired');
      expect(recurrence).toContain('Residual 1267');
      expect(recurrence).toContain('handle-calendar-select');
      expect(recurrence).not.toMatch(/function formatDateToYMD\b/);
      expect(recurrence).not.toContain("from '../../../../../shared/utils/format-date-to-ymd'");
    });

    it('soft residual 1252 superseded: parseToDate dual retired in residual 1255', () => {
      // Residual 1255 dual-retired parseToDate/parseInputToDate onto shared sole.
      expect(schedule).toContain('Residual 1255');
      expect(schedule).toContain('parse-to-date');
      expect(schedule).not.toMatch(/function parseToDate\b/);
      expect(timeConfig).toContain('Residual 1255');
      expect(timeConfig).not.toMatch(/function parseInputToDate\b/);
    });

    it('runtime: sole formats local Date to YYYY-MM-DD', () => {
      expect(formatDateToYMD(new Date(2026, 6, 24))).toBe('2026-07-24');
      expect(formatDateToYMD(new Date(2026, 0, 5))).toBe('2026-01-05');
      expect(formatDateToYMD(new Date(2026, 11, 9))).toBe('2026-12-09');
    });

    it('documents residual 1252 lock intent without claiming §13.2 complete', () => {
      const self = readFileSync(resolve(dir, 'dual-registry.surface.spec.ts'), 'utf8');
      expect(self).toContain('Residual 1252');
      expect(self).toContain('Does not flip §13.2 checkboxes');
      expect(self).toContain('dual retired');
    });
  });
}

// --- merged from format-date-unknown-dual.surface.spec.ts ---
{
  /**
   * Residual 1264: formatDateUnknown dual retired onto app-react shared sole.
   * - sole: packages/app-react/src/utils/format-date-unknown.ts (@dailyuse/time dateTime + English 'Unknown')
   * - consumers: NotificationDetailScreen + NotificationCard
   * Soft residual 1264 / 1261 / 1240:
   * - formatDateNotSet dual-retired sole remains separate (date-only + 'Not set')
   * - TaskDetailScreen: time.format.dateTime + empty.display 'Not set'
   * - GoalCompareScreen: time.format.date + empty.display '-' (Residual 1240 keep-boundary)
   * Does not flip §13.2 checkboxes.
   */
  describe('formatDateUnknown dual retired (residual 1264)', () => {
    const dir = __dirname;
    const reactUtils = resolve(dir, '../../../../app-react/src/utils');
    const reactScreens = resolve(dir, '../../../../app-react/src/screens');
    const reactComponents = resolve(dir, '../../../../app-react/src/components');
    const sole = readFileSync(resolve(reactUtils, 'format-date-unknown.ts'), 'utf8');
    const detail = readFileSync(resolve(reactScreens, 'NotificationDetailScreen.tsx'), 'utf8');
    const card = readFileSync(resolve(reactComponents, 'NotificationCard.tsx'), 'utf8');
    const taskDetail = readFileSync(resolve(reactScreens, 'TaskDetailScreen.tsx'), 'utf8');
    const notSetSole = readFileSync(resolve(reactUtils, 'format-date-not-set.ts'), 'utf8');

    it('owns sole formatDateUnknown body (Residual 1264)', () => {
      expect(sole).toContain('Residual 1264');
      expect(sole).toMatch(/export function formatDateUnknown\b/);
      expect(sole).toContain("emptyKind('unknown')");
      expect(sole).toContain('formatProductDateTime');
      expect(sole).toContain('product-time');
      const body = sole.match(/export function formatDateUnknown\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(body).toContain('number | null | undefined');
      expect(body).toContain('formatProductDateTime');
      expect(body).not.toContain('createTimeFacade');
      expect(body).not.toContain("'Not set'");
      expect(body).not.toContain("return '-'");
    });

    it('retires Notification dual bodies onto shared sole', () => {      for (const [label, source] of [
        ['detail', detail],
        ['card', card],
      ] as const) {
        expect(source, label).toContain('Residual 1264');
        expect(source, label).toContain('format-date-unknown');
        expect(source, label).toContain('formatDateUnknown');
        expect(source, label).not.toMatch(/function formatDate\b/);
        expect(source, label).not.toMatch(
          /function formatDate\b[\s\S]*?'Unknown'[\s\S]*?toLocaleString/,
        );
      }
    });

    it('soft residual 1264 formatDateNotSet sole + task Not set stay separate', () => {
      expect(notSetSole).toContain('Residual 1261');
      expect(notSetSole).toMatch(/export function formatDateNotSet\b/);
      expect(notSetSole).toContain("emptyKind('notSet')");
      expect(notSetSole).toContain('formatProductDate');
      expect(notSetSole).not.toContain("'Unknown'");
      const notSetBody = notSetSole.match(/export function formatDateNotSet\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(notSetBody).toContain('formatProductDate');
      expect(notSetBody).not.toContain("'Unknown'");

      expect(taskDetail).toContain("emptyKind('notSet')");
      expect(taskDetail).toContain('formatProductDateTime');
      expect(taskDetail).not.toMatch(/function formatDate\b/);
      expect(taskDetail).not.toContain('format-date-unknown');
    });

    it('documents residual 1264 lock intent without claiming §13.2 complete', () => {      const self = readFileSync(resolve(dir, 'dual-registry.surface.spec.ts'), 'utf8');
      expect(self).toContain('Residual 1264');
      expect(self).toContain('Does not flip §13.2 checkboxes');
      expect(self).toContain('dual retired');
    });
  });
}

// --- merged from format-display-date-dual.surface.spec.ts ---
{
  /**
   * Residual 1249: formatDisplayDate dual retired onto app-vue shared sole.
   * - sole: packages/app-vue/src/shared/utils/format-display-date.ts
   * - consumers: CreateScheduleDialog, TimeConfigSection, ReminderSection, RecurrenceSection
   * Soft residual 1249/1255: parseToDate dual retired onto shared sole in residual 1255.
   * Soft residual 1240: formatDate keep-boundary remains separate (timestamp display, not YYYY-MM-DD).
   * Soft residual 1246: describeConflict keep-boundary remains separate.
   * Does not flip §13.2 checkboxes.
   */
  describe('formatDisplayDate dual retired (residual 1249)', () => {
    const dir = __dirname;
    const sole = readFileSync(resolve(dir, 'format-display-date.ts'), 'utf8');
    const schedule = readFileSync(
      resolve(dir, '../../modules/schedule/components/CreateScheduleDialog.vue'),
      'utf8',
    );
    const timeConfig = readFileSync(
      resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/TimeConfigSection.vue'),
      'utf8',
    );
    const reminder = readFileSync(
      resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/ReminderSection.vue'),
      'utf8',
    );
    const recurrence = readFileSync(
      resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/RecurrenceSection.vue'),
      'utf8',
    );

    it('owns sole formatDisplayDate body (Residual 1249 / ADR-037 W2 → @dailyuse/time)', () => {
      expect(sole).toContain('Residual 1249');
      expect(sole).toContain('@dailyuse/time');
      expect(sole).toMatch(/export\s*\{\s*formatDisplayDate\s*\}/);
      const timeSole = readFileSync(
        resolve(dir, '../../../../time/src/free/format-helpers.ts'),
        'utf8',
      );
      expect(timeSole).toMatch(/export function formatDisplayDate\b/);
      expect(timeSole).toContain('ymdDisplay');
    });

    it('retires schedule/task dual bodies onto shared sole', () => {
      for (const [label, source] of [
        ['schedule', schedule],
        ['timeConfig', timeConfig],
        ['reminder', reminder],
        ['recurrence', recurrence],
      ] as const) {
        expect(source, label).toContain('Residual 1249');
        expect(source, label).toContain('format-display-date');
        expect(source, label).toContain('formatDisplayDate');
        expect(source, label).not.toMatch(/function formatDisplayDate\b/);
        expect(source, label).not.toMatch(/function formatEndDateDisplay\b/);
        // no local display helper body (toLocaleDateString short month) remains
        expect(source, label).not.toMatch(
          /function format(?:DisplayDate|EndDateDisplay)\b[\s\S]*?toLocaleDateString/,
        );
      }
      expect(schedule).toContain('formatDisplayDate(formData.startDate, locale)');
      expect(timeConfig).toContain('formatDisplayDate(startDate, locale)');
      expect(reminder).toContain('formatDisplayDate(getAbsoluteDatePart(trigger.absoluteTime)!, locale)');
      expect(recurrence).toContain('formatDisplayDate(endDate, locale)');
    });

    it('soft residual 1249 superseded: parseToDate dual retired in residual 1255', () => {
      expect(schedule).toContain('Residual 1255');
      expect(schedule).toContain('parse-to-date');
      expect(schedule).not.toMatch(/function parseToDate\b/);
      expect(timeConfig).toContain('Residual 1255');
      expect(timeConfig).not.toMatch(/function parseInputToDate\b/);
    });

    it('runtime: sole formats YYYY-MM-DD empty and locale short month', () => {
      expect(formatDisplayDate('', 'en-US')).toBe('');
      const en = formatDisplayDate('2026-07-24', 'en-US');
      expect(en).toMatch(/2026/);
      expect(en).toMatch(/Jul|July|24/);
      const zh = formatDisplayDate('2026-07-24', 'zh-CN');
      expect(zh).toMatch(/2026/);
      expect(zh).toMatch(/7|24/);
    });

    it('documents residual 1249 lock intent without claiming §13.2 complete', () => {
      const self = readFileSync(resolve(dir, 'dual-registry.surface.spec.ts'), 'utf8');
      expect(self).toContain('Residual 1249');
      expect(self).toContain('Does not flip §13.2 checkboxes');
      expect(self).toContain('dual retired');
    });
  });
}

// --- merged from format-event-time-local-hhmm-dual.surface.spec.ts ---
{
  /**
   * Residual 1300: Day/Week formatEventTime inner HH:mm dual retired onto formatLocalHHmm sole.
   * Residual 1279 separator keep-boundary remains (Day " - " vs Week compact "-").
   * Soft residual: Month eventClass translucent/text vs calendarEventBgClass; getEventStyle Day px vs Week %.
   * Does not flip §13.2 checkboxes.
   */
  describe('formatEventTime local HH:mm dual retired (residual 1300)', () => {
    const dir = __dirname;
    const day = readFileSync(
      resolve(dir, '../../modules/schedule/components/DayViewCalendar.vue'),
      'utf8',
    );
    const week = readFileSync(
      resolve(dir, '../../modules/schedule/components/WeekViewCalendar.vue'),
      'utf8',
    );
    const sole = readFileSync(resolve(dir, 'format-local-hhmm.ts'), 'utf8');

    it('owns Residual 1300 markers and formatLocalHHmm consumption on Day/Week', () => {
      expect(day).toContain('Residual 1300');
      expect(week).toContain('Residual 1300');
      expect(day).toContain('formatLocalHHmm');
      expect(week).toContain('formatLocalHHmm');
      expect(sole).toContain('@dailyuse/time');
      expect(sole).toMatch(/export\s*\{\s*formatLocalHHmm\s*\}/);
    });

    it('retires Day/Week padStart dual bodies while keeping separator keep-boundary', () => {
      const dayBody = day.match(/function formatEventTime\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(dayBody).toContain('formatLocalHHmm');
      expect(dayBody).toContain(' - ');
      expect(dayBody).not.toContain('padStart');
      expect(dayBody).not.toContain('getHours');

      const weekBody = week.match(/function formatEventTime\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(weekBody).toContain('formatLocalHHmm');
      expect(weekBody).toContain('}-${');
      expect(weekBody).not.toContain('padStart');
      expect(weekBody).not.toContain('getHours');
      expect(weekBody).not.toContain(' - ');
    });

    it('soft residual: Month eventClass + getEventStyle Day/Week keep-boundaries stay separate', () => {
      const month = readFileSync(
        resolve(dir, '../../modules/schedule/components/MonthViewCalendar.vue'),
        'utf8',
      );
      const dayView = readFileSync(
        resolve(dir, '../../modules/schedule/components/DayViewCalendar.vue'),
        'utf8',
      );
      const weekView = readFileSync(
        resolve(dir, '../../modules/schedule/components/WeekViewCalendar.vue'),
        'utf8',
      );
      expect(month).toMatch(/function eventClass\b/);
      expect(month).toContain('bg-warning/15');
      expect(month).toContain(':class="eventClass(event)"');
      expect(month).not.toContain(':class="calendarEventBgClass(event)"');
      const dayStyle = dayView.match(/function getEventStyle\([\s\S]*?\n\}/)?.[0] ?? '';
      const weekStyle = weekView.match(/function getEventStyle\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(dayStyle).toContain('px');
      expect(weekStyle).toContain('%');
    });

    it('runtime: formatLocalHHmm agrees with Day/Week clock fragment', () => {
      const start = new Date(2026, 6, 24, 9, 5, 0).getTime();
      const end = new Date(2026, 6, 24, 10, 30, 0).getTime();
      expect(formatLocalHHmm(start)).toBe('09:05');
      expect(formatLocalHHmm(end)).toBe('10:30');
      expect(`${formatLocalHHmm(start)} - ${formatLocalHHmm(end)}`).toBe('09:05 - 10:30');
      expect(`${formatLocalHHmm(start)}-${formatLocalHHmm(end)}`).toBe('09:05-10:30');
    });

    it('documents residual 1300 lock intent without claiming §13.2 complete', () => {
      const self = readFileSync(
        resolve(dir, 'dual-registry.surface.spec.ts'),
        'utf8',
      );
      expect(self).toContain('Residual 1300');
      expect(self).toContain('Does not flip §13.2 checkboxes');
      expect(self).toContain('dual retired');
    });
  });
}

// --- merged from format-hhmm-parts-dual.surface.spec.ts ---
{
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

    it('owns sole formatHHmmParts body (Residual 1297 / ADR-037 W2 → @dailyuse/time)', () => {
      expect(sole).toContain('Residual 1297');
      expect(sole).toContain('@dailyuse/time');
      expect(sole).toMatch(/export\s*\{\s*formatHHmmParts\s*\}/);
      const timeSole = readFileSync(
        resolve(dir, '../../../../time/src/free/format-helpers.ts'),
        'utf8',
      );
      expect(timeSole).toMatch(/export function formatHHmmParts\b/);
      expect(timeSole).toContain('hhmmParts');
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
      expect(hour).toContain('@dailyuse/time');
      expect(hour).toMatch(/export\s*\{\s*formatHour\s*\}/);
      expect(hour).toContain(':00');
      expect(hour).not.toContain('formatHHmmParts');
    });

    it('runtime: formatHHmmParts pads hour and minute', () => {
      expect(formatHHmmParts(9, 5)).toBe('09:05');
      expect(formatHHmmParts(0, 0)).toBe('00:00');
      expect(formatHHmmParts(23, 59)).toBe('23:59');
    });

    it('documents residual 1297 lock intent without claiming §13.2 complete', () => {
      const self = readFileSync(resolve(dir, 'dual-registry.surface.spec.ts'), 'utf8');
      expect(self).toContain('Residual 1297');
      expect(self).toContain('Does not flip §13.2 checkboxes');
      expect(self).toContain('dual retired');
    });
  });
}

// --- merged from format-hour-dual.surface.spec.ts ---
{
  /**
   * Residual 1276: formatHour dual retired onto app-vue shared sole.
   * Residual 1318: sole body padStart dual retired onto padTwoDigits composition.
   * - sole: packages/app-vue/src/shared/utils/format-hour.ts
   * - consumers: DayViewCalendar + WeekViewCalendar
   * Soft residual 1276 / Residual 1279: formatEventTime keep-boundary (Day " - " vs Week "-") remains separate
   * Soft residual 1273: formatCalendarEventTimeRange dual-retired sole remains separate
   * Does not flip §13.2 checkboxes.
   */
  describe('formatHour dual retired (residual 1276)', () => {
    const dir = __dirname;
    const sole = readFileSync(resolve(dir, 'format-hour.ts'), 'utf8');
    const day = readFileSync(
      resolve(dir, '../../modules/schedule/components/DayViewCalendar.vue'),
      'utf8',
    );
    const week = readFileSync(
      resolve(dir, '../../modules/schedule/components/WeekViewCalendar.vue'),
      'utf8',
    );
    const eventRangeSole = readFileSync(
      resolve(dir, 'format-calendar-event-time-range.ts'),
      'utf8',
    );

    it('owns sole formatHour body (Residual 1276 / ADR-037 W2 → @dailyuse/time)', () => {
      expect(sole).toContain('Residual 1276');
      expect(sole).toContain('@dailyuse/time');
      expect(sole).toContain(':00');
      expect(sole).toMatch(/export\s*\{\s*formatHour\s*\}/);
      const timeSole = readFileSync(
        resolve(dir, '../../../../time/src/free/format-helpers.ts'),
        'utf8',
      );
      expect(timeSole).toMatch(/export function formatHour\b/);
      expect(timeSole).toContain('hourLabel');
    });

    it('retires Day/Week dual bodies onto shared sole', () => {
      for (const [label, source] of [
        ['day', day],
        ['week', week],
      ] as const) {
        expect(source, label).toContain('Residual 1276');
        expect(source, label).toContain('format-hour');
        expect(source, label).toContain('formatHour');
        expect(source, label).not.toMatch(/function formatHour\b/);
        expect(source, label).not.toMatch(
          /function formatHour\b[\s\S]*?padStart/,
        );
      }
    });

    it('soft residual 1279 formatEventTime keep-boundary + event-range sole stay separate', () => {
      expect(day).toContain('Residual 1279 keep-boundary');
      const dayEvent = day.match(/function formatEventTime\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(dayEvent).toContain(' - ');
      expect(dayEvent).not.toContain('–');
      expect(dayEvent).not.toContain('formatCalendarEventTimeRange');

      expect(week).toContain('Residual 1279 keep-boundary');
      const weekEvent = week.match(/function formatEventTime\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(weekEvent).toContain('}-${');
      expect(weekEvent).not.toContain(' - ');
      expect(weekEvent).not.toContain('–');

      expect(eventRangeSole).toContain('Residual 1273');
      expect(eventRangeSole).toContain('–');
    });

    it('runtime: sole pads hour to HH:00', () => {
      expect(formatHour(0)).toBe('00:00');
      expect(formatHour(9)).toBe('09:00');
      expect(formatHour(23)).toBe('23:00');
    });

    it('documents residual 1276 lock intent without claiming §13.2 complete', () => {
      const self = readFileSync(resolve(dir, 'dual-registry.surface.spec.ts'), 'utf8');
      expect(self).toContain('Residual 1276');
      expect(self).toContain('Does not flip §13.2 checkboxes');
      expect(self).toContain('dual retired');
    });
  });
}

// --- merged from format-local-hhmm-dual.surface.spec.ts ---
{
  /**
   * Residual 1294: multi-site HH:mm padStart dual retired onto formatLocalHHmm sole.
   * Residual 1318: sole body padStart dual retired onto padTwoDigits composition.
   * - sole: packages/app-vue/src/shared/utils/format-local-hhmm.ts
   * - consumers: formatCapsuleTime alias, ReminderCapsulePreview formatTime, UpcomingRemindersWidget formatReminderTime
   * Soft residual 1237: dashboard relative i18n keep-boundary remains (Residual 1309 composes absolute HH:mm only)
   * Does not flip §13.2 checkboxes.
   */
  describe('formatLocalHHmm dual retired (residual 1294)', () => {
    const dir = __dirname;
    const sole = readFileSync(resolve(dir, 'format-local-hhmm.ts'), 'utf8');
    const schedule = readFileSync(
      resolve(dir, '../../modules/schedule/composables/useCalendarView.ts'),
      'utf8',
    );
    const capsule = readFileSync(
      resolve(dir, '../../layouts/shell/previews/ReminderCapsulePreview.vue'),
      'utf8',
    );
    const upcoming = readFileSync(
      resolve(dir, '../../modules/reminder/components/widgets/UpcomingRemindersWidget.vue'),
      'utf8',
    );

    it('owns sole formatLocalHHmm body (Residual 1294 / ADR-037 W2 → @dailyuse/time)', () => {
      expect(sole).toContain('Residual 1294');
      expect(sole).toContain("@dailyuse/time");
      expect(sole).toMatch(/export\s*\{\s*formatLocalHHmm\s*\}/);
      const timeSole = readFileSync(
        resolve(dir, '../../../../time/src/free/format-helpers.ts'),
        'utf8',
      );
      expect(timeSole).toMatch(/export function formatLocalHHmm\b/);
      expect(timeSole).toContain('localHHmm');
    });

    it('retires formatCapsuleTime / ReminderCapsule / UpcomingReminders dual bodies onto sole', () => {
      expect(schedule).toContain('Residual 1294');
      expect(schedule).toContain('format-local-hhmm');
      const capBody = schedule.match(/export function formatCapsuleTime\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(capBody).toContain('formatLocalHHmm');
      expect(capBody).not.toContain('padStart');

      expect(capsule).toContain('Residual 1294');
      expect(capsule).toContain('formatProductHm');
      expect(capsule).not.toMatch(/function formatTime\b/);
      expect(capsule).not.toContain('padStart');

      expect(upcoming).toContain('Residual 1294');
      expect(upcoming).toContain('formatLocalHHmm');
      const uBody = upcoming.match(/function formatReminderTime\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(uBody).toContain("return '--:--'");
      expect(uBody).toContain('formatLocalHHmm');
      expect(uBody).not.toContain('padStart');
    });

    it('soft residual 1237 dashboard relative formatActivityTime keep-boundary stays separate', () => {
      const dashboard = readFileSync(
        resolve(dir, '../../modules/dashboard/components/DashboardActivityTimeline.vue'),
        'utf8',
      );
      expect(dashboard).toMatch(/function formatActivityTime\b/);
      expect(dashboard).toContain('dashboard.time');
      expect(dashboard).toContain("t('dashboard.time.justNow')");
      expect(dashboard).toContain('getProductTime');
      const body = dashboard.match(/function formatActivityTime\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(body).toContain('dashboard.time');
      expect(body).not.toContain('date-fns');
    });

    it('runtime: sole and formatCapsuleTime alias agree on local HH:mm', () => {
      const ms = new Date(2026, 6, 24, 9, 5, 0).getTime();
      expect(formatLocalHHmm(ms)).toBe('09:05');
      expect(formatCapsuleTime(ms)).toBe('09:05');
    });

    it('documents residual 1294 lock intent without claiming §13.2 complete', () => {
      const self = readFileSync(resolve(dir, 'dual-registry.surface.spec.ts'), 'utf8');
      expect(self).toContain('Residual 1294');
      expect(self).toContain('Does not flip §13.2 checkboxes');
      expect(self).toContain('dual retired');
    });
  });
}

// --- merged from format-schedule-duration-minutes-dual.surface.spec.ts ---
{
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
      expect(body).toContain('splitDurationMinutes');
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
      expect(msBody).toContain('splitDurationMs');
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
        resolve(dir, 'dual-registry.surface.spec.ts'),
        'utf8',
      );
      expect(self).toContain('Residual 1324');
      expect(self).toContain('Does not flip §13.2 checkboxes');
      expect(self).toContain('dual retired');
    });
  });
}

// --- merged from format-time-dashboard-local-hhmm-dual.surface.spec.ts ---
{
  /**
   * Residual 1309: dashboard formatTime absolute HH:mm dual retired onto formatLocalHHmm sole.
   * Residual 1237 relative i18n keep-boundary remains (justNow/minutesAgo/hoursAgo via dashboard.time.*).
   * Soft residual: setting product datetime + goal product pattern stay separate;
   * form hour/minute padStart option lists (TimeConfig/Reminder/CreateSchedule) not force-merged.
   * Does not flip §13.2 checkboxes.
   */
  describe('dashboard formatTime absolute HH:mm dual retired (residual 1309)', () => {
    const dir = __dirname;
    const dashboard = readFileSync(
      resolve(dir, '../../modules/dashboard/components/DashboardActivityTimeline.vue'),
      'utf8',
    );
    const sole = readFileSync(resolve(dir, 'format-local-hhmm.ts'), 'utf8');

    it('owns Residual 1309 composition on dashboard absolute branch', () => {
      expect(dashboard).toContain('Residual 1309');
      expect(dashboard).toContain('formatProductPattern');
      expect(dashboard).toContain('Residual 1237');
      expect(sole).toContain('@dailyuse/time');
      expect(sole).toMatch(/export\s*\{\s*formatLocalHHmm\s*\}/);
      const body = dashboard.match(/function formatActivityTime\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(body).toContain('dashboard.time');
      expect(body).toContain('formatProductPattern');
      expect(body).not.toContain('padStart');
      expect(body).not.toContain('getHours');
      expect(body).not.toContain('getMinutes');
    });

    it('keeps Residual 1237 relative i18n keep-boundary (no force-merge to HH:mm-only)', () => {
      const body = dashboard.match(/function formatActivityTime\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(body).toContain("t('dashboard.time.justNow')");
      expect(body).toContain("t('dashboard.time.minutesAgo'");
      expect(body).toContain("t('dashboard.time.hoursAgo'");
      expect(body).toContain('getProductTime');
    });

    it('soft residual: setting/goal formatTime keep-boundaries stay separate', () => {
      const setting = readFileSync(
        resolve(dir, '../../modules/setting/components/SettingAdvancedActions.vue'),
        'utf8',
      );
      const progress = readFileSync(
        resolve(dir, '../../modules/goal/components/ProgressBreakdownPanel.vue'),
        'utf8',
      );
      expect(setting).toContain('Soft residual 1237');
      expect(setting).toContain('formatProductDateTime');
      expect(setting).not.toContain('formatLocalHHmm');
      expect(progress).toContain('Soft residual 1237');
      expect(progress).not.toContain('formatLocalHHmm');
    });

    it('runtime: formatLocalHHmm pads absolute clock used by dashboard fallback shape', () => {
      const ms = new Date(2026, 6, 24, 9, 5, 0).getTime();
      expect(formatLocalHHmm(ms)).toBe('09:05');
      const date = new Date(ms);
      expect(`${date.getMonth() + 1}/${date.getDate()} ${formatLocalHHmm(ms)}`).toBe('7/24 09:05');
    });

    it('documents residual 1309 lock intent without claiming §13.2 complete', () => {
      const self = readFileSync(
        resolve(dir, 'dual-registry.surface.spec.ts'),
        'utf8',
      );
      expect(self).toContain('Residual 1309');
      expect(self).toContain('Does not flip §13.2 checkboxes');
      expect(self).toContain('dual retired');
    });
  });
}

// --- merged from get-week-start-dual.surface.spec.ts ---
{
  /**
   * Residual 1285: getWeekStart dual retired onto schedule getWeekStart sole.
   * - sole: packages/app-vue/src/modules/schedule/composables/useCalendarView.ts#getWeekStart
   * - consumers: WeekViewCalendar + ScheduleCalendarView
   * Soft residual 1282: toLocalDateKey dual-retired sole remains separate
   * Soft residual 1285: formatCapsuleTime / multi-site HH:mm padStart keep-boundaries remain separate
   * Soft residual 1288: eventBgClass dual retired onto calendarEventBgClass sole
   * Does not flip §13.2 checkboxes.
   */
  describe('getWeekStart dual retired (residual 1285)', () => {
    const dir = __dirname;
    const sole = readFileSync(
      resolve(dir, '../../modules/schedule/composables/useCalendarView.ts'),
      'utf8',
    );
    const week = readFileSync(
      resolve(dir, '../../modules/schedule/components/WeekViewCalendar.vue'),
      'utf8',
    );
    const view = readFileSync(
      resolve(dir, '../../modules/schedule/views/ScheduleCalendarView.vue'),
      'utf8',
    );

    it('owns sole getWeekStart body (Residual 1285)', () => {
      expect(sole).toContain('Residual 1285');
      expect(sole).toMatch(/export function getWeekStart\b/);
      const body = sole.match(/export function getWeekStart\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(body).toContain('date: Date');
      expect(body).toContain('getDay()');
      expect(body).toContain('day === 0 ? -6 : 1 - day');
      expect(body).toContain('setHours(0, 0, 0, 0)');
      expect(body).toContain('Monday as week start');
    });

    it('retires WeekView + ScheduleCalendarView dual bodies onto schedule sole', () => {
      for (const [label, source] of [
        ['week', week],
        ['view', view],
      ] as const) {
        expect(source, label).toContain('Residual 1285');
        expect(source, label).toContain('getWeekStart');
        expect(source, label).toContain('useCalendarView');
        expect(source, label).not.toMatch(/function getWeekStart\b/);
        expect(source, label).not.toMatch(
          /function getWeekStart\b[\s\S]*?setHours\(0, 0, 0, 0\)/,
        );
      }
    });

    it('soft residual 1282 toLocalDateKey sole stays separate', () => {
      expect(sole).toContain('Residual 1282');
      expect(sole).toMatch(/export function toLocalDateKey\b/);
      expect(toLocalDateKey(new Date(2026, 6, 24))).toBe('2026-07-24');
    });

    it('runtime: sole Monday-starts local week and zeros hours', () => {
      // 2026-07-24 is Friday → week starts Monday 2026-07-20
      const fri = new Date(2026, 6, 24, 15, 30, 0);
      const start = getWeekStart(fri);
      expect(start.getFullYear()).toBe(2026);
      expect(start.getMonth()).toBe(6);
      expect(start.getDate()).toBe(20);
      expect(start.getDay()).toBe(1);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);

      // Sunday maps back to prior Monday
      const sun = new Date(2026, 6, 26, 8, 0, 0); // Sunday
      const sunStart = getWeekStart(sun);
      expect(sunStart.getDate()).toBe(20);
      expect(sunStart.getDay()).toBe(1);
    });

    it('documents residual 1285 lock intent without claiming §13.2 complete', () => {
      const self = readFileSync(resolve(dir, 'dual-registry.surface.spec.ts'), 'utf8');
      expect(self).toContain('Residual 1285');
      expect(self).toContain('Does not flip §13.2 checkboxes');
      expect(self).toContain('dual retired');
    });
  });
}

// --- merged from handle-absolute-date-select-dual.surface.spec.ts ---
{
  /**
   * Residual 1270: handleAbsoluteDateSelect Date/toDate dual retired onto handleCalendarSelect sole.
   * - sole: packages/app-vue/src/shared/utils/handle-calendar-select.ts (Residual 1258)
   * - consumer: ReminderSection handleAbsoluteDateSelect → dateStr then absoluteTime composition
   * Soft residual 1270:
   * - absoluteTime hour/minute composition remains co-located (no force-merge into sole)
   * Soft residual 1267: Recurrence endDate dual-retired onto sole remains separate surface
   * Soft residual 1252: formatDateToYMD dual-retired sole remains separate (getAbsoluteDatePart)
   * Does not flip §13.2 checkboxes.
   */
  describe('handleAbsoluteDateSelect dual retired (residual 1270)', () => {
    const dir = __dirname;
    const sole = readFileSync(resolve(dir, 'handle-calendar-select.ts'), 'utf8');
    const reminder = readFileSync(
      resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/ReminderSection.vue'),
      'utf8',
    );
    const recurrence = readFileSync(
      resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/RecurrenceSection.vue'),
      'utf8',
    );

    it('owns Residual 1270 lock on handleCalendarSelect sole consumer notes', () => {
      expect(sole).toContain('Residual 1258');
      expect(sole).toContain('ReminderSection');
      expect(sole).toContain('1270');
      expect(sole).toMatch(/export function handleCalendarSelect\b/);
    });

    it('retires Reminder Date/toDate dual body onto sole', () => {
      expect(reminder).toContain('Residual 1270');
      expect(reminder).toContain('handle-calendar-select');
      expect(reminder).toContain('handleCalendarSelect');
      expect(reminder).toMatch(/function handleAbsoluteDateSelect\b/);
      const body = reminder.match(/function handleAbsoluteDateSelect\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(body).toContain('handleCalendarSelect');
      expect(body).toContain('absoluteTime');
      expect(body).not.toContain('instanceof Date');
      expect(body).not.toContain("'toDate' in date");
      expect(body).not.toContain('formatDateToYMD(date)');
    });

    it('soft residual 1270 absoluteTime composition + recurrence endDate path stay distinct', () => {
      expect(reminder).toContain('Soft residual 1270');
      const body = reminder.match(/function handleAbsoluteDateSelect\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(body).toContain('getAbsoluteHour');
      expect(body).toContain('getAbsoluteMinute');
      expect(body).toContain('updateTriggers');

      expect(recurrence).toContain('Residual 1267');
      expect(recurrence).toMatch(/function handleEndDateCalendarSelect\b/);
      const endBody = recurrence.match(/function handleEndDateCalendarSelect\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(endBody).toContain('endDate.value');
      expect(endBody).not.toContain('absoluteTime');
    });

    it('runtime: sole empty/Date contracts still support Reminder dateStr capture', () => {
      let dateStr = 'seed';
      handleCalendarSelect(new Date(2026, 6, 24), (v) => {
        dateStr = v;
      });
      expect(dateStr).toBe('2026-07-24');
      handleCalendarSelect(null, (v) => {
        dateStr = v;
      });
      expect(dateStr).toBe('');
    });

    it('documents residual 1270 lock intent without claiming §13.2 complete', () => {
      const self = readFileSync(
        resolve(dir, 'dual-registry.surface.spec.ts'),
        'utf8',
      );
      expect(self).toContain('Residual 1270');
      expect(self).toContain('Does not flip §13.2 checkboxes');
      expect(self).toContain('dual retired');
    });
  });
}

// --- merged from handle-calendar-select-dual.surface.spec.ts ---
{
  /**
   * Residual 1258: handleCalendarSelect dual retired onto app-vue shared sole.
   * - sole: packages/app-vue/src/shared/utils/handle-calendar-select.ts
   * - consumers: CreateScheduleDialog, TimeConfigSection, RecurrenceSection (1267), ReminderSection (1270)
   * Soft residual 1270: Reminder absoluteTime hour/minute composition remains co-located
   * Soft residual 1267: Recurrence handleEndDateCalendarSelect dual-retired onto sole.
   * Soft residual 1252: formatDateToYMD dual-retired sole remains separate.
   * Soft residual 1255: parseToDate dual-retired sole remains separate.
   * Does not flip §13.2 checkboxes.
   */
  describe('handleCalendarSelect dual retired (residual 1258)', () => {
    const dir = __dirname;
    const sole = readFileSync(resolve(dir, 'handle-calendar-select.ts'), 'utf8');
    const schedule = readFileSync(
      resolve(dir, '../../modules/schedule/components/CreateScheduleDialog.vue'),
      'utf8',
    );
    const timeConfig = readFileSync(
      resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/TimeConfigSection.vue'),
      'utf8',
    );
    const recurrence = readFileSync(
      resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/RecurrenceSection.vue'),
      'utf8',
    );
    const reminder = readFileSync(
      resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/ReminderSection.vue'),
      'utf8',
    );

    it('owns sole handleCalendarSelect body (Residual 1258)', () => {
      expect(sole).toContain('Residual 1258');
      expect(sole).toMatch(/export function handleCalendarSelect\b/);
      expect(sole).toContain("from './format-date-to-ymd'");
      expect(sole).toContain('formatDateToYMD');
      const body = sole.match(/export function handleCalendarSelect\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(body).toContain('date instanceof Date');
      expect(body).toContain("'toDate' in date");
      expect(body).toContain("setter('')");
    });

    it('retires schedule/task dual bodies onto shared sole', () => {
      expect(schedule).toContain('Residual 1258');
      expect(schedule).toContain('handle-calendar-select');
      expect(schedule).toContain('handleCalendarSelect');
      expect(schedule).not.toMatch(/function handleCalendarSelect\b/);

      expect(timeConfig).toContain('Residual 1258');
      expect(timeConfig).toContain('handle-calendar-select');
      expect(timeConfig).toContain('handleCalendarSelect');
      expect(timeConfig).not.toMatch(/function handleCalendarSelect\b/);

      // Residual 1267 dual-retired Recurrence endDate calendar onto sole.
      expect(recurrence).toContain('Residual 1267');
      expect(recurrence).toContain('handle-calendar-select');
      expect(recurrence).toContain('handleCalendarSelect');
      expect(recurrence).toMatch(/function handleEndDateCalendarSelect\b/);
      const endBody = recurrence.match(/function handleEndDateCalendarSelect\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(endBody).toContain('handleCalendarSelect');
      expect(endBody).toContain('endDate.value');
      expect(endBody).not.toContain('formatDateToYMD');
    });

    it('Residual 1270 reminder calendar Date/toDate dual retired onto sole; composition soft', () => {
      expect(reminder).toContain('Residual 1270');
      expect(reminder).toContain('handle-calendar-select');
      expect(reminder).toContain('handleCalendarSelect');
      expect(reminder).toMatch(/function handleAbsoluteDateSelect\b/);
      const body = reminder.match(/function handleAbsoluteDateSelect\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(body).toContain('handleCalendarSelect');
      expect(body).toContain('absoluteTime');
      expect(body).not.toContain('instanceof Date');
      expect(body).not.toContain('formatDateToYMD(date)');
      expect(reminder).toContain('Soft residual 1270');
    });

    it('runtime: sole Date / toDate / empty contracts', () => {
      const seen: string[] = [];
      const set = (v: string) => {
        seen.push(v);
      };
      handleCalendarSelect(new Date(2026, 6, 24), set);
      expect(seen.at(-1)).toBe('2026-07-24');
      handleCalendarSelect({ toDate: () => new Date(2026, 0, 5) }, set);
      expect(seen.at(-1)).toBe('2026-01-05');
      handleCalendarSelect(null, set);
      expect(seen.at(-1)).toBe('');
      handleCalendarSelect('not-a-date', set);
      expect(seen.at(-1)).toBe('');
    });

    it('documents residual 1258 lock intent without claiming §13.2 complete', () => {
      const self = readFileSync(resolve(dir, 'dual-registry.surface.spec.ts'), 'utf8');
      expect(self).toContain('Residual 1258');
      expect(self).toContain('Does not flip §13.2 checkboxes');
      expect(self).toContain('dual retired');
    });
  });
}

// --- merged from handle-end-date-calendar-select-dual.surface.spec.ts ---
{
  /**
   * Residual 1267: handleEndDateCalendarSelect dual retired onto handleCalendarSelect sole.
   * - sole: packages/app-vue/src/shared/utils/handle-calendar-select.ts (Residual 1258)
   * - consumer: RecurrenceSection handleEndDateCalendarSelect → setter(endDate ref)
   * Soft residual 1270: Reminder absoluteTime hour/minute composition remains co-located
   * Residual 1270: Reminder Date/toDate dual retired onto handleCalendarSelect sole.
   * Soft residual 1255: endDateAsDate inline YYYY-MM-DD→Date remains co-located
   * Soft residual 1252: formatDateToYMD dual-retired sole remains separate
   * Does not flip §13.2 checkboxes.
   */
  describe('handleEndDateCalendarSelect dual retired (residual 1267)', () => {
    const dir = __dirname;
    const sole = readFileSync(resolve(dir, 'handle-calendar-select.ts'), 'utf8');
    const recurrence = readFileSync(
      resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/RecurrenceSection.vue'),
      'utf8',
    );
    const reminder = readFileSync(
      resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/ReminderSection.vue'),
      'utf8',
    );

    it('owns Residual 1267 lock on handleCalendarSelect sole consumer notes', () => {
      expect(sole).toContain('Residual 1258');
      expect(sole).toContain('RecurrenceSection');
      expect(sole).toContain('Residual 1267');
      expect(sole).toMatch(/export function handleCalendarSelect\b/);
    });

    it('retires Recurrence handleEndDateCalendarSelect dual body onto sole', () => {
      expect(recurrence).toContain('Residual 1267');
      expect(recurrence).toContain('handle-calendar-select');
      expect(recurrence).toContain('handleCalendarSelect');
      expect(recurrence).toMatch(/function handleEndDateCalendarSelect\b/);
      const body = recurrence.match(/function handleEndDateCalendarSelect\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(body).toContain('handleCalendarSelect');
      expect(body).toContain('endDate.value');
      expect(body).not.toContain('formatDateToYMD');
      expect(body).not.toContain('instanceof Date');
      expect(recurrence).not.toContain("from '../../../../../shared/utils/format-date-to-ymd'");
    });

    it('soft residual 1270 reminder absoluteTime composition stays co-located after Date dual-retire', () => {
      expect(reminder).toContain('Residual 1270');
      expect(reminder).toContain('handle-calendar-select');
      expect(reminder).toContain('Soft residual 1270');
      expect(reminder).toContain('absoluteTime');
      const body = reminder.match(/function handleAbsoluteDateSelect\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(body).toContain('handleCalendarSelect');
      expect(body).toContain('getAbsoluteHour');
      expect(body).toContain('getAbsoluteMinute');
      expect(body).not.toContain('instanceof Date');
    });

    it('runtime: sole setter path still maps Date / empty for endDate-style use', () => {
      let value = 'seed';
      handleCalendarSelect(new Date(2026, 6, 24), (v) => {
        value = v;
      });
      expect(value).toBe('2026-07-24');
      handleCalendarSelect(null, (v) => {
        value = v;
      });
      expect(value).toBe('');
    });

    it('documents residual 1267 lock intent without claiming §13.2 complete', () => {
      const self = readFileSync(
        resolve(dir, 'dual-registry.surface.spec.ts'),
        'utf8',
      );
      expect(self).toContain('Residual 1267');
      expect(self).toContain('Does not flip §13.2 checkboxes');
      expect(self).toContain('dual retired');
    });
  });
}

// --- merged from pad-two-digits-compose-dual.surface.spec.ts ---
{
  /**
   * Residual 1318: multi-sole padStart dual retired onto padTwoDigits composition.
   * - formatHHmmParts / formatLocalHHmm / formatHour / formatDateToYMD bodies compose padTwoDigits
   * - join contracts remain on Residual 1297/1294/1276/1252 soles
   * Residual 1321: toLocalDateKey Date|number sole composes padTwoDigits.
   * Soft residual: setting/goal multi-site formatTime keep-boundary.
   * Does not flip §13.2 checkboxes.
   */
  describe('padTwoDigits multi-sole compose dual retired (residual 1318)', () => {
    const dir = __dirname;
    const pad = readFileSync(resolve(dir, 'pad-two-digits.ts'), 'utf8');
    const parts = readFileSync(resolve(dir, 'format-hhmm-parts.ts'), 'utf8');
    const local = readFileSync(resolve(dir, 'format-local-hhmm.ts'), 'utf8');
    const hour = readFileSync(resolve(dir, 'format-hour.ts'), 'utf8');
    const ymd = readFileSync(resolve(dir, 'format-date-to-ymd.ts'), 'utf8');

    it('owns Residual 1318 composition on four soles onto padTwoDigits (ADR-037 → @dailyuse/time)', () => {
      expect(pad).toContain('Residual 1318');
      expect(pad).toContain('@dailyuse/time');
      expect(pad).toMatch(/export\s*\{\s*padTwoDigits\s*\}/);
      const timeSole = readFileSync(
        resolve(dir, '../../../../time/src/free/format-helpers.ts'),
        'utf8',
      );
      expect(timeSole).toMatch(/export function padTwoDigits\b/);
      for (const [label, source] of [
        ['parts', parts],
        ['local', local],
        ['hour', hour],
        ['ymd', ymd],
      ] as const) {
        expect(source, label).toContain('Residual 1318');
        expect(source, label).toContain('@dailyuse/time');
      }
      // Implementation composition (padTwoDigits) is owned by @dailyuse/time format/engine.
      expect(timeSole).toContain('padTwoDigits');
      expect(timeSole).not.toMatch(/\.padStart\(/);
    });

    it('keeps Residual 1297/1294/1276/1252 join contracts on respective soles (via @dailyuse/time)', () => {
      expect(parts).toContain('Residual 1297');
      expect(parts).toContain('formatHHmmParts');
      expect(local).toContain('Residual 1294');
      expect(local).toContain('formatLocalHHmm');
      expect(hour).toContain('Residual 1276');
      expect(hour).toContain(':00');
      expect(ymd).toContain('Residual 1252');
      const timeSole = readFileSync(
        resolve(dir, '../../../../time/src/free/format-helpers.ts'),
        'utf8',
      );
      expect(timeSole).toMatch(/export function formatDateToYMD\b/);
      expect(timeSole).toContain('dateToYmd');
    });

    it('Residual 1321: toLocalDateKey composes padTwoDigits; setting/goal formatTime keep-boundary', () => {
      const calendar = readFileSync(
        resolve(dir, '../../modules/schedule/composables/useCalendarView.ts'),
        'utf8',
      );
      const key = calendar.match(/export function toLocalDateKey\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(key).toContain('padTwoDigits');
      expect(key).not.toContain('padStart');
      expect(calendar).toContain('Residual 1321');
      const setting = readFileSync(
        resolve(dir, '../../modules/setting/components/SettingAdvancedActions.vue'),
        'utf8',
      );
      const progress = readFileSync(
        resolve(dir, '../../modules/goal/components/ProgressBreakdownPanel.vue'),
        'utf8',
      );
      expect(setting).toContain('Soft residual 1237');
      expect(setting).not.toContain('formatLocalHHmm');
      expect(progress).toContain('Soft residual 1237');
      expect(progress).not.toContain('formatLocalHHmm');
    });

    it('runtime: composed soles agree with padTwoDigits', () => {
      expect(formatHHmmParts(9, 5)).toBe(`${padTwoDigits(9)}:${padTwoDigits(5)}`);
      expect(formatHour(9)).toBe(`${padTwoDigits(9)}:00`);
      const ms = new Date(2026, 6, 24, 9, 5, 0).getTime();
      expect(formatLocalHHmm(ms)).toBe(`${padTwoDigits(9)}:${padTwoDigits(5)}`);
      expect(formatDateToYMD(new Date(ms))).toBe(
        `2026-${padTwoDigits(7)}-${padTwoDigits(24)}`,
      );
    });

    it('documents residual 1318 lock intent without claiming §13.2 complete', () => {
      const self = readFileSync(
        resolve(dir, 'dual-registry.surface.spec.ts'),
        'utf8',
      );
      expect(self).toContain('Residual 1318');
      expect(self).toContain('Does not flip §13.2 checkboxes');
      expect(self).toContain('dual retired');
    });
  });
}

// --- merged from pad-two-digits-dual.surface.spec.ts ---
{
  /**
   * Residual 1312: multi-site two-digit padStart dual retired onto padTwoDigits sole.
   * - sole: packages/app-vue/src/shared/utils/pad-two-digits.ts
   * - consumers: TimeConfigSection, ReminderSection, CreateScheduleDialog hour/minute options + parts
   * Residual 1315: ScheduleFormDemo datetime-local dual-retired onto formatDateToYMD + formatLocalHHmm.
   * Residual 1318: formatHHmmParts/formatLocalHHmm/formatHour/formatDateToYMD compose padTwoDigits.
   * Residual 1321: toLocalDateKey Date|number composes padTwoDigits.
   * Soft residual: setting/goal multi-site formatTime keep-boundary.
   * Does not flip §13.2 checkboxes.
   */
  describe('padTwoDigits dual retired (residual 1312)', () => {
    const dir = __dirname;
    const sole = readFileSync(resolve(dir, 'pad-two-digits.ts'), 'utf8');
    const timeConfig = readFileSync(
      resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/TimeConfigSection.vue'),
      'utf8',
    );
    const reminder = readFileSync(
      resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/ReminderSection.vue'),
      'utf8',
    );
    const createSchedule = readFileSync(
      resolve(dir, '../../modules/schedule/components/CreateScheduleDialog.vue'),
      'utf8',
    );

    it('owns sole padTwoDigits body (Residual 1312 / ADR-037 → @dailyuse/time)', () => {
      expect(sole).toContain('Residual 1312');
      expect(sole).toContain('Residual 1318');
      expect(sole).toContain('@dailyuse/time');
      expect(sole).toMatch(/export\s*\{\s*padTwoDigits\s*\}/);
      const timeSole = readFileSync(
        resolve(dir, '../../../../time/src/free/format-helpers.ts'),
        'utf8',
      );
      expect(timeSole).toMatch(/export function padTwoDigits\b/);
    });

    it('retires TimeConfig / Reminder / CreateSchedule dual bodies onto sole', () => {
      for (const [label, source] of [
        ['timeConfig', timeConfig],
        ['reminder', reminder],
        ['createSchedule', createSchedule],
      ] as const) {
        expect(source, label).toContain('Residual 1312');
        expect(source, label).toContain('padTwoDigits');
        expect(source, label).toContain('hourOptions');
        expect(source, label).toContain('minuteOptions');
        // option lists should not inline padStart
        const hourLine = source.match(/const hourOptions = [^\n]+/)?.[0] ?? '';
        const minuteLine = source.match(/const minuteOptions = [^\n]+/)?.[0] ?? '';
        expect(hourLine, label).toContain('padTwoDigits');
        expect(hourLine, label).not.toContain('padStart');
        expect(minuteLine, label).toContain('padTwoDigits');
        expect(minuteLine, label).not.toContain('padStart');
      }

      const split = timeConfig.match(/function splitMinutes\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(split).toContain('padTwoDigits');
      expect(split).not.toContain('padStart');

      // Reminder absolute hour/minute extractors
      expect(reminder).toContain('function getAbsoluteHour');
      expect(reminder).toContain('function getAbsoluteMinute');
      const hourFn = reminder.match(/function getAbsoluteHour\([\s\S]*?\n\}/)?.[0] ?? '';
      const minuteFn = reminder.match(/function getAbsoluteMinute\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(hourFn).toContain('padTwoDigits');
      expect(hourFn).not.toContain('padStart');
      expect(minuteFn).toContain('padTwoDigits');
      expect(minuteFn).not.toContain('padStart');
    });

    it('soft residual Residual 1315: ScheduleFormDemo composes YMD+HH:mm soles (not padTwoDigits)', () => {
      const demo = readFileSync(
        resolve(dir, '../../modules/schedule/components/ScheduleFormDemo.vue'),
        'utf8',
      );
      expect(demo).toContain('Residual 1315');
      expect(demo).toContain('formatDateToYMD');
      expect(demo).toContain('formatLocalHHmm');
      expect(demo).not.toContain('padTwoDigits');
      const body = demo.match(/function formatDateTimeToInput\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(body).not.toContain('padStart');
    });

    it('runtime: padTwoDigits and formatHHmmParts composition agree', () => {
      expect(padTwoDigits(0)).toBe('00');
      expect(padTwoDigits(9)).toBe('09');
      expect(padTwoDigits(23)).toBe('23');
      expect(formatHHmmParts(9, 5)).toBe(`${padTwoDigits(9)}:${padTwoDigits(5)}`);
    });

    it('documents residual 1312 lock intent without claiming §13.2 complete', () => {
      const self = readFileSync(resolve(dir, 'dual-registry.surface.spec.ts'), 'utf8');
      expect(self).toContain('Residual 1312');
      expect(self).toContain('Does not flip §13.2 checkboxes');
      expect(self).toContain('dual retired');
    });
  });
}

// --- merged from parse-to-date-dual.surface.spec.ts ---
{
  /**
   * Residual 1255: parseToDate dual retired onto app-vue shared sole.
   * - sole: packages/app-vue/src/shared/utils/parse-to-date.ts
   * - consumers: CreateScheduleDialog (parseToDate), TimeConfigSection (was parseInputToDate)
   * Soft residual 1255:
   * - RecurrenceSection endDateAsDate inline YYYY-MM-DD→Date
   * - TimeConfig dateStr→getTime helper still co-located
   * Soft residual 1249/1252: formatDisplayDate / formatDateToYMD dual-retired soles remain separate.
   * Soft residual 1252 surface soft residual parse* notes superseded by this dual-retire.
   * Does not flip §13.2 checkboxes.
   */
  describe('parseToDate dual retired (residual 1255)', () => {
    const dir = __dirname;
    const sole = readFileSync(resolve(dir, 'parse-to-date.ts'), 'utf8');
    const schedule = readFileSync(
      resolve(dir, '../../modules/schedule/components/CreateScheduleDialog.vue'),
      'utf8',
    );
    const timeConfig = readFileSync(
      resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/TimeConfigSection.vue'),
      'utf8',
    );
    const recurrence = readFileSync(
      resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/RecurrenceSection.vue'),
      'utf8',
    );

    it('owns sole parseToDate body (Residual 1255)', () => {
      expect(sole).toContain('Residual 1255');
      expect(sole).toMatch(/export function parseToDate\b/);
      expect(sole).toContain("dateStr + 'T00:00:00'");
      const body = sole.match(/export function parseToDate\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(body).toContain('undefined');
      expect(body).toContain('new Date');
    });

    it('retires schedule/task dual bodies onto shared sole', () => {
      expect(schedule).toContain('Residual 1255');
      expect(schedule).toContain('parse-to-date');
      expect(schedule).toContain('parseToDate');
      expect(schedule).not.toMatch(/function parseToDate\b/);

      expect(timeConfig).toContain('Residual 1255');
      expect(timeConfig).toContain('parse-to-date');
      expect(timeConfig).toContain('parseToDate');
      expect(timeConfig).not.toMatch(/function parseInputToDate\b/);
      expect(timeConfig).not.toMatch(/function parseToDate\b/);
    });

    it('soft residual 1255 recurrence endDateAsDate + timeConfig getTime stay co-located', () => {
      expect(recurrence).toContain('Soft residual 1255');
      expect(recurrence).toContain("endDate.value + 'T00:00:00'");
      expect(recurrence).not.toContain('parse-to-date');

      expect(timeConfig).toContain("codec.startOfYmd");
    });

    it('runtime: sole parses empty and local calendar day', () => {
      expect(parseToDate('')).toBeUndefined();
      const d = parseToDate('2026-07-24');
      expect(d).toBeInstanceOf(Date);
      expect(d!.getFullYear()).toBe(2026);
      expect(d!.getMonth()).toBe(6);
      expect(d!.getDate()).toBe(24);
    });

    it('documents residual 1255 lock intent without claiming §13.2 complete', () => {
      const self = readFileSync(resolve(dir, 'dual-registry.surface.spec.ts'), 'utf8');
      expect(self).toContain('Residual 1255');
      expect(self).toContain('Does not flip §13.2 checkboxes');
      expect(self).toContain('dual retired');
    });
  });
}

// --- merged from schedule-form-demo-datetime-local-dual.surface.spec.ts ---
{
  /**
   * Residual 1315: ScheduleFormDemo datetime-local composition dual retired onto
   * formatDateToYMD (YYYY-MM-DD) + formatLocalHHmm (HH:mm) soles.
   * Residual 1318: formatDateToYMD / formatLocalHHmm / formatHHmmParts / formatHour compose padTwoDigits.
   * Soft residual: toLocalDateKey Date|number sole padStart; setting/goal multi-site formatTime keep-boundary.
   * Does not flip §13.2 checkboxes.
   */
  describe('ScheduleFormDemo datetime-local dual retired (residual 1315)', () => {
    const dir = __dirname;
    const demo = readFileSync(
      resolve(dir, '../../modules/schedule/components/ScheduleFormDemo.vue'),
      'utf8',
    );
    const ymd = readFileSync(resolve(dir, 'format-date-to-ymd.ts'), 'utf8');
    const hhmm = readFileSync(resolve(dir, 'format-local-hhmm.ts'), 'utf8');

    it('owns Residual 1315 composition on formatDateTimeToInput', () => {
      expect(demo).toContain('Residual 1315');
      expect(demo).toContain('formatDateToYMD');
      expect(demo).toContain('formatLocalHHmm');
      expect(ymd).toContain('@dailyuse/time');
      expect(ymd).toMatch(/export\s*\{\s*formatDateToYMD\s*\}/);
      expect(hhmm).toContain('@dailyuse/time');
      expect(hhmm).toMatch(/export\s*\{\s*formatLocalHHmm\s*\}/);
      const body = demo.match(/function formatDateTimeToInput\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(body).toContain('formatDateToYMD');
      expect(body).toContain('formatLocalHHmm');
      expect(body).not.toContain('padStart');
      expect(body).not.toContain('getFullYear');
      expect(body).not.toContain('getHours');
      expect(body).not.toContain('getMinutes');
    });

    it('keeps formatDateToYMD Date-only and formatLocalHHmm ms soles separate', () => {
      expect(ymd).toContain('Residual 1252');
      expect(ymd).not.toContain('formatLocalHHmm');
      expect(hhmm).toContain('Residual 1294');
      expect(hhmm).not.toContain('formatDateToYMD');
    });

    it('Residual 1318: YMD/HH:mm soles compose padTwoDigits via @dailyuse/time; setting/goal formatTime keep-boundary', () => {
      const parts = readFileSync(resolve(dir, 'format-hhmm-parts.ts'), 'utf8');
      const hour = readFileSync(resolve(dir, 'format-hour.ts'), 'utf8');
      for (const [label, source] of [
        ['parts', parts],
        ['hour', hour],
        ['ymd', ymd],
        ['hhmm', hhmm],
      ] as const) {
        expect(source, label).toContain('@dailyuse/time');
        expect(source, label).toContain('Residual 1318');
      }
      const timeSole = readFileSync(
        resolve(dir, '../../../../time/src/free/format-helpers.ts'),
        'utf8',
      );
      expect(timeSole).toContain('padTwoDigits');
      expect(timeSole).not.toMatch(/\.padStart\(/);
      const setting = readFileSync(
        resolve(dir, '../../modules/setting/components/SettingAdvancedActions.vue'),
        'utf8',
      );
      const progress = readFileSync(
        resolve(dir, '../../modules/goal/components/ProgressBreakdownPanel.vue'),
        'utf8',
      );
      expect(setting).toContain('Soft residual 1237');
      expect(setting).not.toContain('formatLocalHHmm');
      expect(progress).toContain('Soft residual 1237');
      expect(progress).not.toContain('formatLocalHHmm');
    });

    it('runtime: datetime-local composition agrees with soles', () => {
      const ms = new Date(2026, 6, 24, 9, 5, 0).getTime();
      expect(`${formatDateToYMD(new Date(ms))}T${formatLocalHHmm(ms)}`).toBe('2026-07-24T09:05');
    });

    it('documents residual 1315 lock intent without claiming §13.2 complete', () => {
      const self = readFileSync(
        resolve(dir, 'dual-registry.surface.spec.ts'),
        'utf8',
      );
      expect(self).toContain('Residual 1315');
      expect(self).toContain('Does not flip §13.2 checkboxes');
      expect(self).toContain('dual retired');
    });
  });
}

// --- merged from to-local-date-key-dual.surface.spec.ts ---
{
  /**
   * Residual 1282: toDateStr dual retired onto schedule toLocalDateKey sole.
   * - sole: packages/app-vue/src/modules/schedule/composables/useCalendarView.ts#toLocalDateKey
   * - consumers: DayViewCalendar + WeekViewCalendar + MonthViewCalendar
   * Residual 1321: sole body padStart dual retired onto padTwoDigits composition.
   * Soft residual 1252: formatDateToYMD dual-retired Date-only form sole remains separate
   * Soft residual 1285: getWeekStart dual retired onto schedule sole in residual 1285.
   * Does not flip §13.2 checkboxes.
   */
  describe('toLocalDateKey dual retired (residual 1282)', () => {
    const dir = __dirname;
    const sole = readFileSync(
      resolve(dir, '../../modules/schedule/composables/useCalendarView.ts'),
      'utf8',
    );
    const day = readFileSync(
      resolve(dir, '../../modules/schedule/components/DayViewCalendar.vue'),
      'utf8',
    );
    const week = readFileSync(
      resolve(dir, '../../modules/schedule/components/WeekViewCalendar.vue'),
      'utf8',
    );
    const month = readFileSync(
      resolve(dir, '../../modules/schedule/components/MonthViewCalendar.vue'),
      'utf8',
    );
    const formatYmd = readFileSync(resolve(dir, 'format-date-to-ymd.ts'), 'utf8');

    it('owns sole toLocalDateKey body (Residual 1282)', () => {
      expect(sole).toContain('Residual 1282');
      expect(sole).toContain('Residual 1321');
      expect(sole).toMatch(/export function toLocalDateKey\b/);
      const body = sole.match(/export function toLocalDateKey\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(body).toContain('Date | number');
      expect(body).toContain('getFullYear');
      expect(body).toContain('getMonth()');
      expect(body).toContain('getDate()');
      expect(body).toContain('typeof value === \'number\'');
      expect(body).toContain('padTwoDigits');
      expect(body).not.toContain('padStart');
    });

    it('retires Day/Week/Month toDateStr dual bodies onto toLocalDateKey sole', () => {
      for (const [label, source] of [
        ['day', day],
        ['week', week],
        ['month', month],
      ] as const) {
        expect(source, label).toContain('Residual 1282');
        expect(source, label).toContain('toLocalDateKey');
        expect(source, label).not.toMatch(/function toDateStr\b/);
        expect(source, label).not.toMatch(/function toLocalDateKey\b/);
        expect(source, label).not.toMatch(
          /function toDateStr\b[\s\S]*?getFullYear/,
        );
      }
    });

    it('soft residual 1252 formatDateToYMD Date-only sole stays separate; getWeekStart dual retired 1285', () => {
      expect(formatYmd).toContain('Residual 1252');
      expect(formatYmd).toContain('@dailyuse/time');
      expect(formatYmd).toMatch(/export\s*\{\s*formatDateToYMD\s*\}/);
      const timeYmd = readFileSync(
        resolve(dir, '../../../../time/src/free/format-helpers.ts'),
        'utf8',
      );
      expect(timeYmd).toMatch(/export function formatDateToYMD\b/);
      expect(timeYmd).toContain('date: Date');

      // Date branch parity without force-merging form sole into calendar key sole
      expect(formatDateToYMD(new Date(2026, 6, 24))).toBe(toLocalDateKey(new Date(2026, 6, 24)));

      // Residual 1285: getWeekStart dual retired onto schedule sole.
      expect(week).toContain('Residual 1285');
      expect(week).not.toMatch(/function getWeekStart\b/);
      const scheduleView = readFileSync(
        resolve(dir, '../../modules/schedule/views/ScheduleCalendarView.vue'),
        'utf8',
      );
      expect(scheduleView).toContain('Residual 1285');
      expect(scheduleView).not.toMatch(/function getWeekStart\b/);
    });

    it('runtime: sole formats Date and ms timestamp to YYYY-MM-DD', () => {
      expect(toLocalDateKey(new Date(2026, 6, 24))).toBe('2026-07-24');
      expect(toLocalDateKey(new Date(2026, 0, 5).getTime())).toBe('2026-01-05');
    });

    it('documents residual 1282 lock intent without claiming §13.2 complete', () => {
      const self = readFileSync(resolve(dir, 'dual-registry.surface.spec.ts'), 'utf8');
      expect(self).toContain('Residual 1282');
      expect(self).toContain('Does not flip §13.2 checkboxes');
      expect(self).toContain('dual retired');
    });
  });
}

// --- merged from to-local-date-key-pad-two-digits-dual.surface.spec.ts ---
{
  /**
   * Residual 1321: toLocalDateKey padStart dual retired onto padTwoDigits composition.
   * - sole: useCalendarView.ts#toLocalDateKey (Date|number → YYYY-MM-DD key contract stays Residual 1282)
   * Soft residual: setting/goal multi-site formatTime keep-boundary (relative/date-fns/toLocaleString).
   * Does not flip §13.2 checkboxes.
   */
  describe('toLocalDateKey → padTwoDigits dual retired (residual 1321)', () => {
    const dir = __dirname;
    const calendar = readFileSync(
      resolve(dir, '../../modules/schedule/composables/useCalendarView.ts'),
      'utf8',
    );
    const pad = readFileSync(resolve(dir, 'pad-two-digits.ts'), 'utf8');

    it('owns Residual 1321 composition on toLocalDateKey onto padTwoDigits', () => {
      expect(calendar).toContain('Residual 1321');
      expect(calendar).toContain('Residual 1282');
      expect(pad).toContain('Residual 1318');
      expect(pad).toContain('@dailyuse/time');
      expect(pad).toMatch(/export\s*\{\s*padTwoDigits\s*\}/);
      const body = calendar.match(/export function toLocalDateKey\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(body).toContain('padTwoDigits');
      expect(body).not.toContain('padStart');
      expect(body).toContain('Date | number');
      expect(body).toContain("typeof value === 'number'");
      expect(calendar).toContain("from '../../../shared/utils/pad-two-digits'");
    });

    it('keeps Residual 1282 Date|number key contract separate from formatDateToYMD Date-only sole', () => {
      const ymd = readFileSync(resolve(dir, 'format-date-to-ymd.ts'), 'utf8');
      expect(ymd).toContain('Residual 1252');
      expect(ymd).toContain('@dailyuse/time');
      expect(ymd).toMatch(/export\s*\{\s*formatDateToYMD\s*\}/);
      const timeYmd = readFileSync(
        resolve(dir, '../../../../time/src/free/format-helpers.ts'),
        'utf8',
      );
      expect(timeYmd).toContain('date: Date');
      // Date branch parity
      expect(formatDateToYMD(new Date(2026, 6, 24))).toBe(toLocalDateKey(new Date(2026, 6, 24)));
    });

    it('soft residual: setting/goal multi-site formatTime keep-boundary stays separate', () => {
      const setting = readFileSync(
        resolve(dir, '../../modules/setting/components/SettingAdvancedActions.vue'),
        'utf8',
      );
      const progress = readFileSync(
        resolve(dir, '../../modules/goal/components/ProgressBreakdownPanel.vue'),
        'utf8',
      );
      expect(setting).toContain('Soft residual 1237');
      expect(setting).not.toContain('formatLocalHHmm');
      expect(setting).not.toContain('toLocalDateKey');
      expect(progress).toContain('Soft residual 1237');
      expect(progress).not.toContain('formatLocalHHmm');
      expect(progress).not.toContain('toLocalDateKey');
    });

    it('runtime: toLocalDateKey agrees with padTwoDigits composition', () => {
      const d = new Date(2026, 6, 24);
      expect(toLocalDateKey(d)).toBe(
        `${d.getFullYear()}-${padTwoDigits(d.getMonth() + 1)}-${padTwoDigits(d.getDate())}`,
      );
      expect(toLocalDateKey(new Date(2026, 0, 5).getTime())).toBe('2026-01-05');
    });

    it('documents residual 1321 lock intent without claiming §13.2 complete', () => {
      const self = readFileSync(
        resolve(dir, 'dual-registry.surface.spec.ts'),
        'utf8',
      );
      expect(self).toContain('Residual 1321');
      expect(self).toContain('Does not flip §13.2 checkboxes');
      expect(self).toContain('dual retired');
    });
  });
}
