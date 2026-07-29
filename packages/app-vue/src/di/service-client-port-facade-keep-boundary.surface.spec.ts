import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 927: I*Service = *ClientPort intentional DI facade keep-boundary.
 * Facades are type aliases only (no second interface body). InjectionKeys bind
 * the I*Service names so hosts/composables stay DI-oriented without importing
 * every package client port at call sites.
 * Soft residual 915: DESKTOP_AUTH_API_KEY dual retired
 *   (desktop-auth-api-key-dual.surface.spec.ts).
 * Soft residual 270: DesktopBridge dual collapsed to ElectronBridge
 *   (desktop-bridge-electron-bridge-dual.surface.spec.ts).
 * Does not flip §13.2 checkboxes.
 */
describe('DI I*Service ClientPort facade keep-boundary (residual 927)', () => {
  const diDir = __dirname;
  const types = readFileSync(resolve(diDir, 'types.ts'), 'utf8');
  const keys = readFileSync(resolve(diDir, 'keys.ts'), 'utf8');

  const facades: Array<[string, string]> = [
    ['IAccountService', 'AccountClientPort'],
    ['IAuthService', 'AuthenticationClientPort'],
    ['IGoalService', 'GoalClientPort'],
    ['ITaskService', 'TaskClientPort'],
    ['IScheduleService', 'ScheduleClientPort'],
    ['IReminderService', 'ReminderClientPort'],
    ['IRepositoryService', 'RepositoryClientPort'],
    ['INotificationService', 'NotificationClientPort'],
    ['ISettingService', 'SettingClientPort'],
    ['IDataPortabilityService', 'DataPortabilityClientPort'],
    ['IAIService', 'AIClientPort'],
    ['IRuleService', 'GovernanceClientPort'],
  ];

  it('owns each I*Service as type alias of the package ClientPort (no interface dual body)', () => {
    expect(types).toContain('Residual 927');
    for (const [service, port] of facades) {
      expect(types, service).toContain(`export type ${service} = ${port}`);
      expect(types, service).not.toMatch(new RegExp(`export interface ${service}\\b`));
    }
  });

  it('InjectionKeys bind I*Service facades (not raw ClientPort names at key type)', () => {
    expect(keys).toContain('InjectionKey<IAuthService>');
    expect(keys).toContain('InjectionKey<IGoalService>');
    expect(keys).toContain('InjectionKey<IAIService>');
    expect(keys).toContain('AUTH_SERVICE_KEY: InjectionKey<IAuthService>');
    expect(keys).toContain('GOAL_SERVICE_KEY: InjectionKey<IGoalService>');
    // Must not collapse DI keys onto raw package port type params in this surface
    expect(keys).not.toContain('InjectionKey<AuthenticationClientPort>');
    expect(keys).not.toContain('InjectionKey<GoalClientPort>');
  });

  it('imports ClientPort types from package client entrypoints only once each', () => {
    expect(types).toContain("from '@memoflow/authentication/client'");
    expect(types).toContain("from '@memoflow/goal/client'");
    expect(types).toContain("from '@memoflow/ai/client'");
    expect(types).toContain("from '@memoflow/repository/client'");
    // Facade count stays fixed at twelve structural service aliases
    const aliasCount = (
      types.match(/^export type I\w+Service = \w+ClientPort;/gm) ?? []
    ).length;
    expect(aliasCount).toBe(12);
  });
});
