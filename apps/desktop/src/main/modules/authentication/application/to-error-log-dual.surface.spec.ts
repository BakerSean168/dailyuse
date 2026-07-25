import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 939: toErrorLog helper dual retired.
 * Sole body in infrastructure/session-types; login-desktop-account imports it.
 * Soft residual 937: session helper duals retired
 *   (infrastructure/session-helper-dual.surface.spec.ts).
 * Soft residual 933: AuthRemoteApiResult dual retired
 *   (auth-remote-api-result-dual.surface.spec.ts).
 * Does not flip §13.2 checkboxes.
 */
describe('toErrorLog dual retired (residual 939)', () => {
  const appDir = __dirname;
  const login = readFileSync(resolve(appDir, 'login-desktop-account.ts'), 'utf8');
  const sessionTypes = readFileSync(
    resolve(appDir, '../infrastructure/session-types.ts'),
    'utf8',
  );
  const loginOrchestrator = readFileSync(
    resolve(appDir, '../infrastructure/login-orchestrator.ts'),
    'utf8',
  );
  const gateway = readFileSync(resolve(appDir, 'auth-remote-gateway.ts'), 'utf8');

  it('owns sole toErrorLog helper body in session-types', () => {
    expect(sessionTypes).toContain('Residual 939');
    expect(sessionTypes).toMatch(/export function toErrorLog\b/);
    expect(sessionTypes).toContain('error instanceof Error');
    expect(sessionTypes).toContain('details.cause = toErrorLog(withCause.cause)');
  });

  it('login-desktop-account imports toErrorLog and drops local dual body', () => {
    expect(login).toContain('Residual 939');
    expect(login).toContain(
      "import { toErrorLog } from '../infrastructure/session-types'",
    );
    expect(login).not.toMatch(/function toErrorLog\b/);
    expect(login).toContain('toErrorLog(error)');
  });

  it('login-orchestrator already consumes session-types toErrorLog without local dual', () => {
    expect(loginOrchestrator).toContain(
      "import { toIdentityId, toDeviceInfoDTO, toErrorLog, LOCAL_ACCESS_TOKEN } from './session-types'",
    );
    expect(loginOrchestrator).not.toMatch(/function toErrorLog\b/);
    expect(loginOrchestrator).toContain('toErrorLog(error)');
  });

  it('auth-remote-gateway readErrorPayload uses AuthRemoteErrorData sole return shape', () => {
    expect(gateway).toContain('Residual 939');
    expect(gateway).toContain('export type AuthRemoteErrorData');
    expect(gateway).toContain(
      'function readErrorPayload(body: unknown): AuthRemoteErrorData',
    );
    expect(gateway).not.toContain(
      'function readErrorPayload(body: unknown): { message?: string; error?: string }',
    );
  });
});
