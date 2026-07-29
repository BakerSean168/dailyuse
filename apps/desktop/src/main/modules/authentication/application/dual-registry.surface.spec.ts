/**
 * Dual registry suite (elegance E3b tax cut).
 * Merged 6 dual-retired surface locks from this directory.
 * Behavior/assertions preserved; individual *-dual.surface.spec.ts removed.
 * Sources: auth-flow-result-named-dual.surface.spec.ts, auth-remote-api-result-dual.surface.spec.ts, desktop-login-request-dual.surface.spec.ts, desktop-register-request-dual.surface.spec.ts, desktop-registration-request-payload-dual.surface.spec.ts, to-error-log-dual.surface.spec.ts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// --- merged from auth-flow-result-named-dual.surface.spec.ts ---
{
  /**
   * Residual 917: AuthFlowResult named duals retired.
   * DesktopLoginResult / RegisterResult / DesktopRefreshResult collapsed to sole
   * DesktopAuthFlowResult in auth-flow-types (application AuthFlowResult<AuthResponseDTO>).
   * Residual 895 (soft): layered keep-boundary vs TokenRefreshResult / RefreshSessionResponse
   *   (refresh-result-layered-keep-boundary.surface.spec.ts).
   * Residual 933 (soft): AuthRemoteApiResult dual retired
   *   (auth-remote-api-result-dual.surface.spec.ts).
   * Does not flip §13.2 checkboxes.
   */
  describe('auth-flow-result named duals retired (residual 917)', () => {
    const appDir = __dirname;
    const authFlow = readFileSync(resolve(appDir, 'auth-flow-types.ts'), 'utf8');
    const login = readFileSync(resolve(appDir, 'login-desktop-account.ts'), 'utf8');
    const register = readFileSync(resolve(appDir, 'register-desktop-account.ts'), 'utf8');
    const refresh = readFileSync(resolve(appDir, 'refresh-desktop-session.ts'), 'utf8');

    it('owns DesktopAuthFlowResult sole alias in auth-flow-types', () => {
      expect(authFlow).toContain('Residual 917');
      expect(authFlow).toContain(
        'export type DesktopAuthFlowResult = AuthFlowResult<AuthResponseDTO>',
      );
      expect(authFlow).toContain(
        'export type AuthFlowResult<T> = { ok: true; response: T } | { ok: false; error: AuthFlowError }',
      );
      expect(authFlow).not.toMatch(/export type DesktopLoginResult\b/);
      expect(authFlow).not.toMatch(/export type RegisterResult\b/);
      expect(authFlow).not.toMatch(/export type DesktopRefreshResult\b/);
    });

    it('login/register/refresh return DesktopAuthFlowResult without local dual aliases', () => {
      expect(login).toContain('Residual 917');
      expect(login).toContain('type DesktopAuthFlowResult');
      expect(login).toContain('Promise<DesktopAuthFlowResult>');
      expect(login).not.toMatch(/export type DesktopLoginResult\b/);

      expect(register).toContain('Residual 917');
      expect(register).toContain('type DesktopAuthFlowResult');
      expect(register).toContain('Promise<DesktopAuthFlowResult>');
      expect(register).not.toMatch(/export type RegisterResult\b/);

      expect(refresh).toContain('Residual 917');
      expect(refresh).toContain('type DesktopAuthFlowResult');
      expect(refresh).toContain('Promise<DesktopAuthFlowResult>');
      expect(refresh).not.toMatch(/export type DesktopRefreshResult\b/);
    });

    it('keeps residual 895 layered keep-boundary comment on refresh application flow', () => {
      expect(refresh).toContain('Residual 895');
      expect(refresh).toContain('TokenRefreshResult');
      expect(refresh).toContain('RefreshSessionResponse');
      expect(authFlow).toContain('residual 895');
      expect(authFlow).toContain('TokenRefreshResult');
      expect(authFlow).toContain('RefreshSessionResponse');
    });
  });
}

// --- merged from auth-remote-api-result-dual.surface.spec.ts ---
{
  /**
   * Residual 933: LoginApiResult / RefreshApiResult / RegisterApiResult duals retired.
   * Sole envelope: AuthRemoteApiResult<T> (ok + status + data).
   * Soft residual 931: RegisterRequest→EmailRegisterCredentials
   *   (desktop-register-request-dual.surface.spec.ts).
   * Soft residual 917: DesktopAuthFlowResult named dual retired
   *   (auth-flow-result-named-dual.surface.spec.ts).
   * Keep-boundary: RegisterApiResponse remains loose register payload (≠ strict AuthResponseDTO).
   * Residual 939 (soft): readErrorPayload uses AuthRemoteErrorData sole return
   *   (to-error-log-dual.surface.spec.ts).
   * Residual 947 (soft): isRecord/hasDataKey dual retired
   *   (main/utils/http-envelope-guards-dual.surface.spec.ts).
   * Does not flip §13.2 checkboxes.
   */
  describe('desktop AuthRemoteApiResult dual retired (residual 933)', () => {
    const appDir = __dirname;
    const gateway = readFileSync(resolve(appDir, 'auth-remote-gateway.ts'), 'utf8');

    it('owns AuthRemoteApiResult sole envelope and drops named dual result types', () => {
      expect(gateway).toContain('Residual 933');
      expect(gateway).toContain('export type AuthRemoteApiResult<T>');
      expect(gateway).toContain('ok: boolean');
      expect(gateway).toContain('status: number');
      expect(gateway).toContain('data: T');
      expect(gateway).not.toMatch(/export interface RegisterApiResult\b/);
      expect(gateway).not.toMatch(/export interface LoginApiResult\b/);
      expect(gateway).not.toMatch(/export interface RefreshApiResult\b/);
      expect(gateway).not.toMatch(/export type RegisterApiResult\b/);
      expect(gateway).not.toMatch(/export type LoginApiResult\b/);
      expect(gateway).not.toMatch(/export type RefreshApiResult\b/);
    });

    it('register/login/refresh return AuthRemoteApiResult parameterized envelopes', () => {
      expect(gateway).toContain(
        '): Promise<AuthRemoteApiResult<RegisterApiResponse>>',
      );
      expect(gateway).toContain(
        '): Promise<AuthRemoteApiResult<AuthResponseDTO | AuthRemoteErrorData>>',
      );
      // both login and refresh share the AuthResponseDTO | AuthRemoteErrorData param
      expect(gateway).toContain('async login(');
      expect(gateway).toContain('async refreshToken(');
      expect(
        gateway.split(
          'Promise<AuthRemoteApiResult<AuthResponseDTO | AuthRemoteErrorData>>',
        ).length - 1,
      ).toBe(2);
    });

    it('keeps RegisterApiResponse loose payload keep-boundary (not forced AuthResponseDTO merge)', () => {
      expect(gateway).toMatch(/export interface RegisterApiResponse\b/);
      expect(gateway).toContain('extends Partial<AuthResponseDTO>');
      expect(gateway).toContain('identityId?: string');
      expect(gateway).toContain('sessionId?: string');
      expect(gateway).toContain('message?: string');
      expect(gateway).not.toContain(
        'export type RegisterApiResponse = AuthResponseDTO',
      );
    });
  });
}

// --- merged from desktop-login-request-dual.surface.spec.ts ---
{
  /**
   * Residual 869: DesktopLoginRequest dual retired (type alias of EmailLoginCredentials).
   * Residual 921: DesktopLoginRequest name fully retired — login uses EmailLoginCredentials sole body.
   * Soft residual 871/931: RegisterRequest name dual fully retired — EmailRegisterCredentials
   *   (desktop-register-request-dual.surface.spec.ts).
   * Residual 899 (soft): LoginRequest ≠ EmailLoginCredentials keep-boundary
   *   (infrastructure/login-request-email-credentials-keep-boundary.surface.spec.ts).
   * Does not flip §13.2 checkboxes.
   */
  describe('desktop DesktopLoginRequest dual retired (residual 869/921)', () => {
    const appDir = __dirname;
    const login = readFileSync(resolve(appDir, 'login-desktop-account.ts'), 'utf8');
    const contractsAuth = readFileSync(
      resolve(
        appDir,
        '../../../../../../../packages/contracts/src/modules/authentication/protocol/desktop-auth.types.ts',
      ),
      'utf8',
    );

    it('drops DesktopLoginRequest name and uses EmailLoginCredentials sole body', () => {
      expect(login).toContain('Residual 869');
      expect(login).toContain('Residual 921');
      expect(login).toContain('type EmailLoginCredentials');
      expect(login).toContain('request: EmailLoginCredentials');
      expect(login).not.toMatch(/export type DesktopLoginRequest\b/);
      expect(login).not.toMatch(/export interface DesktopLoginRequest\b/);
      expect(login).not.toMatch(/request: DesktopLoginRequest\b/);
    });

    it('keeps sole EmailLoginCredentials interface body in contracts', () => {
      expect(contractsAuth).toContain('Residual 869');
      expect(contractsAuth).toMatch(/export interface EmailLoginCredentials\b/);
      expect(contractsAuth).not.toMatch(/export interface DesktopLoginRequest\b/);
    });

    it('loginDesktopAccount still exports async login entrypoint', () => {
      expect(login).toContain('export async function loginDesktopAccount');
      expect(login).toContain(
        'onSuccess?: (response: AuthResponseDTO, request: EmailLoginCredentials)',
      );
    });
  });
}

// --- merged from desktop-register-request-dual.surface.spec.ts ---
{
  /**
   * Residual 871: RegisterRequest dual retired (sole body was register-desktop-account).
   * Residual 931: RegisterRequest name fully retired — EmailRegisterCredentials sole body in contracts.
   * Soft residual 875: RegistrationRequestPayload dual retired in
   *   desktop-registration-request-payload-dual.surface.spec.ts.
   * Does not flip §13.2 checkboxes.
   */
  describe('desktop RegisterRequest dual retired (residual 871/931)', () => {
    const appDir = __dirname;
    const register = readFileSync(resolve(appDir, 'register-desktop-account.ts'), 'utf8');
    const coordinator = readFileSync(
      resolve(appDir, 'desktop-credential-auth-coordinator.ts'),
      'utf8',
    );
    const contractsAuth = readFileSync(
      resolve(
        appDir,
        '../../../../../../../packages/contracts/src/modules/authentication/protocol/desktop-auth.types.ts',
      ),
      'utf8',
    );

    it('drops RegisterRequest name and uses EmailRegisterCredentials sole body', () => {
      expect(register).toContain('Residual 871');
      expect(register).toContain('Residual 931');
      expect(register).toContain('EmailRegisterCredentials');
      expect(register).toContain("from '@memoflow/contracts/authentication'");
      expect(register).toContain('request: EmailRegisterCredentials');
      expect(register).not.toMatch(/export interface RegisterRequest\b/);
      expect(register).not.toMatch(/export type RegisterRequest\b/);
      expect(register).not.toMatch(/request: RegisterRequest\b/);
    });

    it('keeps sole EmailRegisterCredentials interface body in contracts', () => {
      expect(contractsAuth).toContain('Residual 931');
      expect(contractsAuth).toMatch(/export interface EmailRegisterCredentials\b/);
      expect(contractsAuth).toContain('email: string');
      expect(contractsAuth).toContain('password: string');
      expect(contractsAuth).toContain('username?: string');
      expect(contractsAuth).not.toMatch(/export interface RegisterRequest\b/);
    });

    it('coordinator uses EmailRegisterCredentials without local dual body', () => {
      expect(coordinator).toContain('Residual 931');
      expect(coordinator).toContain('async register(request: EmailRegisterCredentials)');
      expect(coordinator).toContain('EmailRegisterCredentials');
      expect(coordinator).not.toMatch(/export interface RegisterRequest\b/);
      expect(coordinator).not.toMatch(/export type \{ RegisterRequest \}/);
      expect(register).toContain('export async function registerDesktopAccount');
    });
  });
}

// --- merged from desktop-registration-request-payload-dual.surface.spec.ts ---
{
  /**
   * Residual 875: RegistrationRequestPayload dual retired.
   * Residual 931 (soft): RegisterRequest name dual fully retired — EmailRegisterCredentials sole body
   *   (desktop-register-request-dual.surface.spec.ts).
   * Does not flip §13.2 checkboxes.
   */
  describe('desktop RegistrationRequestPayload dual retired (residual 875)', () => {
    const appDir = __dirname;
    const register = readFileSync(resolve(appDir, 'register-desktop-account.ts'), 'utf8');
    const gateway = readFileSync(resolve(appDir, 'auth-remote-gateway.ts'), 'utf8');

    it('uses EmailRegisterCredentials sole body (no RegisterRequest dual)', () => {
      expect(register).toContain('Residual 931');
      expect(register).toContain('request: EmailRegisterCredentials');
      expect(register).not.toMatch(/export interface RegisterRequest\b/);
      expect(register).not.toMatch(/export type RegisterRequest\b/);
    });

    it('gateway uses EmailRegisterCredentials and does not define RegistrationRequestPayload body', () => {
      expect(gateway).toContain('Residual 875');
      expect(gateway).toContain('Residual 931');
      expect(gateway).toContain('EmailRegisterCredentials');
      expect(gateway).toContain("from '@memoflow/contracts/authentication'");
      expect(gateway).toContain('request: EmailRegisterCredentials');
      expect(gateway).not.toMatch(/export interface RegistrationRequestPayload\b/);
      expect(gateway).not.toMatch(/export type RegistrationRequestPayload\b/);
      expect(gateway).not.toContain("from './register-desktop-account'");
    });

    it('does not reintroduce a RegisterRequest interface body in gateway', () => {
      expect(gateway).not.toMatch(/export interface RegisterRequest\b/);
      expect(register).toContain('export async function registerDesktopAccount');
      expect(gateway).toContain('async register(');
    });
  });
}

// --- merged from to-error-log-dual.surface.spec.ts ---
{
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
}
