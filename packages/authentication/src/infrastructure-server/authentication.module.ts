/**
 * createAuthenticationModule — explicit composition root for the authentication server runtime.
 * createAuthenticationModule —— 认证模块服务端运行时的显式组合根。
 *
 * The outer app selects concrete adapters and passes them in here.
 * This module then assembles the application layer exactly once and exposes a
 * stable facade to HTTP / IPC transports.
 *
 * 外层应用负责选择具体适配器并传入这里。
 * 组合根只做一次组装，然后向 HTTP / IPC 等传输层暴露稳定门面。
 *
 * Authentication uses the same governance-proven pattern: one composition root
 * per module, constructor injection only, no hidden service locator.
 */

import type { IAuthIdentityRepository, IAuthSessionRepository } from '../domain-server';
import type { ITokenProvider } from '../domain-server/services/token-provider.interface';
import type { IPasswordHasher } from '../domain-shared';
import type { Context } from '@dailyuse/contracts/shared';
import type { Result } from '@dailyuse/contracts/result';
import { ok, fail } from '@dailyuse/contracts/result';
import { ResultCode } from '@dailyuse/contracts/result';
import type {
  RegisterByEmailReq,
  RegisterByEmailRes,
  RegisterByPhoneReq,
  RegisterByPhoneRes,
  LoginByEmailReq,
  LoginByEmailRes,
  LoginByPhoneReq,
  LoginByPhoneRes,
  SendSmsCodeReq,
  RefreshTokenReq,
  RefreshTokenRes,
  ChangePasswordReq,
  ChangePasswordRes,
  ForgotPasswordReq,
  ForgotPasswordRes,
  ResetPasswordReq,
  ResetPasswordRes,
  GetCurrentUserRes,
  ListSessionsRes,
  RevokeSessionReq,
  RevokeSessionRes,
} from '@dailyuse/contracts/authentication';
import {
  ChangePassword,
  ForgotPassword,
  ResetPassword,
  GetCurrentUser,
  Login,
  ListSessions,
  Logout,
  Register,
  RefreshToken,
  RevokeSession,
  InvalidResetCodeError,
} from '../application-server';
import { UserAlreadyExistsError } from '../domain-server/services/registration';
import { UserNotFoundError, InvalidPasswordError } from '../domain-server/services/login';
import { UserNotFoundError as ResetPasswordUserNotFoundError } from '../application-server/use-cases/commands/reset-password';
import { InMemoryPasswordResetCodeStore } from './services/in-memory-password-reset-code-store';
import { ConsoleEmailSender } from './services/console-email-sender';

// ---------------------------------------------------------------------------
// Dependencies — 依赖接口
// ---------------------------------------------------------------------------

/**
 * Everything the authentication server runtime needs from the outside world.
 * 认证模块服务端运行时向外部索取的全部依赖。
 *
 * Refactor rule for other modules:
 * - only put ports or runtime contributions here
 * - never put transport objects (Express req/res, ipcMain, Router) here
 * - never hide these dependencies behind a singleton container
 */
export type AuthenticationRuntimeContributionsInput =
  | AuthenticationModuleRuntimeContribution
  | readonly AuthenticationModuleRuntimeContribution[];

export interface AuthenticationModuleDependencies {
  readonly identityRepository: IAuthIdentityRepository;
  readonly sessionRepository: IAuthSessionRepository;
  readonly passwordHasher: IPasswordHasher;
  readonly tokenProvider: ITokenProvider;
  readonly runtimeContributions?: AuthenticationRuntimeContributionsInput;
}

// ---------------------------------------------------------------------------
// Runtime contribution — 运行时贡献
// ---------------------------------------------------------------------------

/**
 * Module-owned runtime side effects.
 * 模块拥有的运行时副作用。
 *
 * A contribution is the unit we start/stop together with the module instance.
 * This is the replacement for older global initialization hooks.
 */
export interface AuthenticationModuleRuntimeContribution {
  start(): void;
  stop(): void;
}

// ---------------------------------------------------------------------------
// Use cases — 已完成接线的底层 use case 集合
// ---------------------------------------------------------------------------

/**
 * Lower-level assembled use cases.
 * 已完成接线的底层 use case 集合。
 *
 * We keep this type because tests and low-level assembly sometimes need direct
 * access to use-case objects, but transports should prefer `AuthenticationApplicationPort`.
 */
export interface AuthenticationModuleUseCases {
  readonly login: Login;
  readonly logout: Logout;
  readonly register: Register;
  readonly refreshToken: RefreshToken;
  readonly getCurrentUser: GetCurrentUser;
  readonly listSessions: ListSessions;
  readonly revokeSession: RevokeSession;
  readonly changePassword: ChangePassword;
  readonly forgotPassword: ForgotPassword;
  readonly resetPassword: ResetPassword;
}

// ---------------------------------------------------------------------------
// Application port — 传输层无关的可调用应用层门面
// ---------------------------------------------------------------------------

/**
 * Transport-neutral callable application surface.
 * 传输层无关的可调用应用层门面。
 *
 * Every method returns `Promise<Result<T>>` so transports never catch domain exceptions.
 * 每个方法返回 `Promise<Result<T>>`，传输层无需捕获领域异常。
 */
export interface AuthenticationApplicationPort {
  register(data: RegisterByEmailReq, cx: Context): Promise<Result<RegisterByEmailRes>>;
  registerByPhone(data: RegisterByPhoneReq, cx: Context): Promise<Result<RegisterByPhoneRes>>;
  login(data: LoginByEmailReq, cx: Context): Promise<Result<LoginByEmailRes>>;
  loginByPhone(data: LoginByPhoneReq, cx: Context): Promise<Result<LoginByPhoneRes>>;
  sendSmsCode(data: SendSmsCodeReq): Promise<Result<void>>;
  logout(cx: Context): Promise<Result<void>>;
  refreshToken(data: RefreshTokenReq, cx: Context): Promise<Result<RefreshTokenRes>>;
  getCurrentUser(cx: Context, sessionId?: string): Promise<Result<GetCurrentUserRes>>;
  listSessions(cx: Context, sessionId?: string): Promise<Result<ListSessionsRes>>;
  revokeSession(data: RevokeSessionReq, cx: Context): Promise<Result<void>>;
  changePassword(data: ChangePasswordReq, cx: Context): Promise<Result<void>>;
  forgotPassword(data: ForgotPasswordReq): Promise<Result<void>>;
  resetPassword(data: ResetPasswordReq): Promise<Result<void>>;
}

// ---------------------------------------------------------------------------
// Module instance — 模块实例返回类型
// ---------------------------------------------------------------------------

/**
 * Primary authentication composition root return type.
 * 认证模块主组合根返回类型。
 *
 * `api` is the transport-facing surface.
 * `useCases` is kept for low-level tests and diagnostics.
 * `start` / `dispose` own runtime side effects.
 */
export interface AuthenticationModuleInstance {
  readonly identityRepository: IAuthIdentityRepository;
  readonly sessionRepository: IAuthSessionRepository;
  readonly useCases: AuthenticationModuleUseCases;
  readonly api: AuthenticationApplicationPort;
  start(): void;
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Assembly helper — 纯组装函数
// ---------------------------------------------------------------------------

/**
 * Pure assembly helper used by the factory and tests.
 * 纯组装函数：给定依赖对象，返回已经接好线的 use case 集合。
 */
export function createAuthenticationUseCases(
  dependencies: Omit<AuthenticationModuleDependencies, 'runtimeContributions'>,
): AuthenticationModuleUseCases {
  const { identityRepository, sessionRepository, passwordHasher, tokenProvider } = dependencies;

  const codeStore = new InMemoryPasswordResetCodeStore();
  const emailSender = new ConsoleEmailSender();

  return {
    login: new Login(identityRepository, sessionRepository, passwordHasher, tokenProvider),
    logout: new Logout(sessionRepository),
    register: new Register(identityRepository, sessionRepository, passwordHasher, tokenProvider),
    refreshToken: new RefreshToken(sessionRepository, identityRepository, tokenProvider),
    getCurrentUser: new GetCurrentUser(identityRepository, sessionRepository),
    listSessions: new ListSessions(sessionRepository),
    revokeSession: new RevokeSession(sessionRepository),
    changePassword: new ChangePassword(identityRepository, sessionRepository, passwordHasher),
    forgotPassword: new ForgotPassword(identityRepository, codeStore, emailSender),
    resetPassword: new ResetPassword(
      identityRepository,
      sessionRepository,
      codeStore,
      passwordHasher,
    ),
  };
}

// ---------------------------------------------------------------------------
// Normalize runtime contributions — 规范化运行时贡献
// ---------------------------------------------------------------------------

function normalizeRuntimeContributions(
  runtimeContributions?:
    | AuthenticationModuleRuntimeContribution
    | ReadonlyArray<AuthenticationModuleRuntimeContribution>,
): readonly AuthenticationModuleRuntimeContribution[] {
  if (!runtimeContributions) {
    return [];
  }

  if (Array.isArray(runtimeContributions)) {
    return Array.from(runtimeContributions);
  }

  return [runtimeContributions as AuthenticationModuleRuntimeContribution];
}

// ---------------------------------------------------------------------------
// Canonical composition root — 规范化的认证模块主组合根
// ---------------------------------------------------------------------------

/**
 * Canonical composition root.
 * 规范化的认证模块主组合根。
 *
 * This is the file other modules should copy first when migrating away from a
 * container-based assembly. The expected reading order is:
 * 1. define `Dependencies`
 * 2. define transport-neutral `ApplicationPort`
 * 3. assemble use cases once
 * 4. wrap them in `api`
 * 5. let the module instance own `start` / `dispose`
 */
export function createAuthenticationModule(
  dependencies: AuthenticationModuleDependencies,
): AuthenticationModuleInstance {
  const { identityRepository, sessionRepository } = dependencies;
  const runtimeContributions = normalizeRuntimeContributions(dependencies.runtimeContributions);
  const useCases = createAuthenticationUseCases(dependencies);
  let started = false;

  // Build the transport-neutral facade
  // 构建传输层无关的门面：将领域异常映射为 Result 错误码
  const api: AuthenticationApplicationPort = {
    register: async (data, cx) => {
      try {
        return ok(await useCases.register.execute(data, cx));
      } catch (err) {
        if (err instanceof UserAlreadyExistsError) {
          return fail({
            code: ResultCode.CONFLICT,
            message: err.message,
            context: {
              ...(err.context ?? {}),
              domainCode: err.code,
            },
          });
        }
        throw err;
      }
    },

    registerByPhone: async (_data, _cx) =>
      fail({
        code: 'SERVICE_UNAVAILABLE',
        message: 'Phone registration is not implemented on the server yet',
      }),

    login: async (data, cx) => {
      try {
        return ok(await useCases.login.execute(data, cx));
      } catch (err) {
        // Security: don't distinguish "user not found" vs "wrong password"
        // 安全：不区分"用户不存在"和"密码错误"
        if (err instanceof UserNotFoundError || err instanceof InvalidPasswordError) {
          return fail({ code: 'UNAUTHORIZED', message: 'Invalid email or password' });
        }
        throw err;
      }
    },

    loginByPhone: async (_data, _cx) =>
      fail({
        code: 'SERVICE_UNAVAILABLE',
        message: 'Phone login is not implemented on the server yet',
      }),

    sendSmsCode: async (_data) =>
      fail({
        code: 'SERVICE_UNAVAILABLE',
        message: 'SMS verification is not implemented on the server yet',
      }),

    logout: async (cx) => {
      await useCases.logout.execute(undefined as void, cx);
      return ok(undefined as void);
    },

    refreshToken: async (data, cx) => ok(await useCases.refreshToken.execute(data, cx)),

    getCurrentUser: async (cx, sessionId) =>
      ok(await useCases.getCurrentUser.execute(cx.identityId, sessionId)),

    listSessions: async (cx, sessionId) =>
      ok(await useCases.listSessions.execute(cx.identityId, sessionId)),

    revokeSession: async (data, cx) => {
      await useCases.revokeSession.execute(data, cx);
      return ok(undefined as void);
    },

    changePassword: async (data, cx) => {
      await useCases.changePassword.execute(data, cx);
      return ok(undefined as void);
    },

    forgotPassword: async (data) => {
      try {
        await useCases.forgotPassword.execute(data);
        return ok(undefined as void);
      } catch (error) {
        return fail({ code: 'INTERNAL_ERROR', message: String(error) });
      }
    },

    resetPassword: async (data) => {
      try {
        await useCases.resetPassword.execute(data);
        return ok(undefined as void);
      } catch (error) {
        if (error instanceof InvalidResetCodeError) {
          return fail({ code: 'VALIDATION_ERROR', message: error.message });
        }
        if (error instanceof ResetPasswordUserNotFoundError) {
          return fail({ code: 'NOT_FOUND', message: error.message });
        }
        return fail({ code: 'INTERNAL_ERROR', message: String(error) });
      }
    },
  };

  return {
    identityRepository,
    sessionRepository,
    useCases,
    api,
    start(): void {
      if (started) {
        return;
      }

      for (const runtime of runtimeContributions) {
        runtime.start();
      }

      started = true;
    },
    dispose(): void {
      if (!started) {
        return;
      }

      for (const runtime of [...runtimeContributions].reverse()) {
        runtime.stop();
      }

      started = false;
    },
  };
}
