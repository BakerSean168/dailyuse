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

import type { IAuthIdentityRepository, IAuthSessionRepository } from '../domain';
import type { ITokenProvider } from '../domain/services/token-provider.interface';
import type { IPasswordHasher } from '../domain';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { Result } from '@dailyuse/contracts/result';
import { fail } from '@dailyuse/contracts/result';
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
  ForgotPasswordReq,
  ResetPasswordReq,
  SendEmailCodeReq,
  VerifyEmailCodeReq,
  VerifyEmailCodeRes,
  GetCurrentUserRes,
  ListSessionsRes,
  RevokeSessionReq,
  OAuthCallbackReq,
  OAuthCallbackRes,
  GetOAuthUrlReq,
  GetOAuthUrlRes,
  OAuthProvidersRes,
  BindOAuthReq,
  BindOAuthRes,
  UnbindOAuthReq,
} from '@dailyuse/contracts/authentication';
import {
  AuthenticateUseCase,
  ChangePasswordUseCase,
  ForgotPasswordUseCase,
  ResetPasswordUseCase,
  SendEmailVerificationCodeUseCase,
  VerifyEmailCodeUseCase,
  GetOAuthUrlUseCase,
  ListOAuthProvidersUseCase,
  BindOAuthUseCase,
  UnbindOAuthUseCase,
  GetCurrentUserUseCase,
  LoginUseCase,
  ListSessionsUseCase,
  LogoutUseCase,
  RegisterUseCase,
  RefreshTokenUseCase,
  RevokeSessionUseCase,
} from '../application';
import {
  AuthenticationMethod,
  AuthenticationProviderRegistry,
  PasswordAuthenticationProvider,
  type AuthenticationProvider,
} from '../domain';
import { InMemoryVerificationChallengeStore } from './services/in-memory-verification-challenge-store';
import { ConsoleEmailSender } from './services/console-email-sender';
import { InMemoryOAuthStateStore } from './services/in-memory-oauth-state-store';

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
  /**
   * Extra pluggable authentication providers (e.g. GitHub, guest, SSO).
   * 额外的可插拔认证提供者（如 GitHub、访客、SSO）。
   *
   * The password provider is always registered by default. Providers listed
   * here are registered on top, so the composition root decides which login
   * methods a given runtime (API / Electron) exposes — without editing the module.
   * 账密提供者始终默认注册；此处列出的提供者叠加注册，由组合根决定某运行时
   * 开放哪些登录方式，无需修改本模块。
   */
  readonly authenticationProviders?: readonly AuthenticationProvider[];
  readonly runtimeContributions?: AuthenticationRuntimeContributionsInput;
  /**
   * Optional GitHub OAuth client id for authorize-url issuance (identity-only scopes).
   * 可选 GitHub OAuth client id，用于签发授权 URL（仅身份 scopes）。
   */
  readonly githubOAuth?: {
    readonly clientId: string;
    readonly authorizeUrl?: string;
  };
  /**
   * Optional GitHub OAuth client used for bind (code exchange). Login providers
   * still come from authenticationProviders.
   * 可选 GitHub OAuth 客户端，用于绑定（code 换主体）。登录提供者仍来自 authenticationProviders。
   */
  readonly githubOAuthClient?: import('../domain/services/providers/i-github-oauth-client').IGithubOAuthClient;
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
  /**
   * Unified pluggable authentication entry point (password / GitHub / ...).
   * 统一的可插拔认证入口（账密 / GitHub / ...）。
   */
  readonly authenticate: AuthenticateUseCase;
  readonly login: LoginUseCase;
  readonly logout: LogoutUseCase;
  readonly register: RegisterUseCase;
  readonly refreshToken: RefreshTokenUseCase;
  readonly getCurrentUser: GetCurrentUserUseCase;
  readonly listSessions: ListSessionsUseCase;
  readonly revokeSession: RevokeSessionUseCase;
  readonly changePassword: ChangePasswordUseCase;
  readonly forgotPassword: ForgotPasswordUseCase;
  readonly resetPassword: ResetPasswordUseCase;
  readonly sendEmailVerificationCode: SendEmailVerificationCodeUseCase;
  readonly verifyEmailCode: VerifyEmailCodeUseCase;
  readonly getOAuthUrl: GetOAuthUrlUseCase;
  readonly listOAuthProviders: ListOAuthProvidersUseCase;
  readonly bindOAuth: BindOAuthUseCase;
  readonly unbindOAuth: UnbindOAuthUseCase;
  readonly oauthStateStore: InMemoryOAuthStateStore;
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
  register(data: RegisterByEmailReq, cx: ExecutionContext, deviceId: string): Promise<Result<RegisterByEmailRes>>;
  registerByPhone(data: RegisterByPhoneReq, cx: ExecutionContext): Promise<Result<RegisterByPhoneRes>>;
  login(data: LoginByEmailReq, cx: ExecutionContext, deviceId: string): Promise<Result<LoginByEmailRes>>;
  loginByPhone(data: LoginByPhoneReq, cx: ExecutionContext): Promise<Result<LoginByPhoneRes>>;
  sendSmsCode(data: SendSmsCodeReq): Promise<Result<void>>;
  logout(cx: ExecutionContext): Promise<Result<void>>;
  refreshToken(data: RefreshTokenReq, cx: ExecutionContext): Promise<Result<RefreshTokenRes>>;
  getCurrentUser(cx: ExecutionContext, sessionId?: string): Promise<Result<GetCurrentUserRes>>;
  listSessions(cx: ExecutionContext, sessionId?: string): Promise<Result<ListSessionsRes>>;
  revokeSession(data: RevokeSessionReq, cx: ExecutionContext): Promise<Result<void>>;
  changePassword(data: ChangePasswordReq, cx: ExecutionContext): Promise<Result<void>>;
  forgotPassword(data: ForgotPasswordReq): Promise<Result<void>>;
  resetPassword(data: ResetPasswordReq): Promise<Result<void>>;
  sendEmailCode(data: SendEmailCodeReq, cx?: ExecutionContext): Promise<Result<void>>;
  verifyEmailCode(data: VerifyEmailCodeReq, cx?: ExecutionContext): Promise<Result<VerifyEmailCodeRes>>;
  /**
   * Pluggable OAuth login callback (currently GitHub).
   * 可插拔 OAuth 登录回调（当前为 GitHub）。
   *
   * Dispatches through the provider registry via {@link AuthenticateUseCase}.
   * Returns SERVICE_UNAVAILABLE when the requested provider is not registered.
   * 通过 AuthenticateUseCase 经注册表分发；未注册对应提供者时返回 SERVICE_UNAVAILABLE。
   */
  oauthCallback(
    data: OAuthCallbackReq,
    cx: ExecutionContext,
    deviceId: string,
  ): Promise<Result<OAuthCallbackRes>>;
  getOAuthUrl(data: GetOAuthUrlReq): Promise<Result<GetOAuthUrlRes>>;
  listOAuthProviders(): Promise<Result<OAuthProvidersRes>>;
  bindOAuth(data: BindOAuthReq, cx: ExecutionContext): Promise<Result<BindOAuthRes>>;
  unbindOAuth(data: UnbindOAuthReq, cx: ExecutionContext): Promise<Result<void>>;
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

  const challengeStore = new InMemoryVerificationChallengeStore();
  const emailSender = new ConsoleEmailSender();
  const oauthStateStore = new InMemoryOAuthStateStore();

  // Build the pluggable provider registry.
  // The password provider is always available; extra providers (GitHub, guest,
  // SSO) are layered on by the composition root without editing this module.
  // 组装可插拔提供者注册表：账密提供者始终可用；GitHub/访客/SSO 等额外提供者
  // 由组合根叠加，无需修改本模块。
  const providerRegistry = new AuthenticationProviderRegistry([
    new PasswordAuthenticationProvider(identityRepository, passwordHasher),
    ...(dependencies.authenticationProviders ?? []),
  ]);

  return {
    authenticate: new AuthenticateUseCase(providerRegistry, sessionRepository, tokenProvider),
    login: new LoginUseCase(identityRepository, sessionRepository, passwordHasher, tokenProvider),
    logout: new LogoutUseCase(sessionRepository),
    register: new RegisterUseCase(identityRepository, sessionRepository, passwordHasher, tokenProvider, challengeStore, emailSender),
    refreshToken: new RefreshTokenUseCase(sessionRepository, identityRepository, tokenProvider),
    getCurrentUser: new GetCurrentUserUseCase(identityRepository, sessionRepository),
    listSessions: new ListSessionsUseCase(sessionRepository),
    revokeSession: new RevokeSessionUseCase(sessionRepository),
    changePassword: new ChangePasswordUseCase(identityRepository, sessionRepository, passwordHasher),
    forgotPassword: new ForgotPasswordUseCase(identityRepository, challengeStore, emailSender),
    resetPassword: new ResetPasswordUseCase(
      identityRepository,
      sessionRepository,
      challengeStore,
      passwordHasher,
    ),
    sendEmailVerificationCode: new SendEmailVerificationCodeUseCase(
      identityRepository,
      challengeStore,
      emailSender,
    ),
    verifyEmailCode: new VerifyEmailCodeUseCase(identityRepository, challengeStore),
    getOAuthUrl: new GetOAuthUrlUseCase(oauthStateStore, dependencies.githubOAuth),
    listOAuthProviders: new ListOAuthProvidersUseCase(dependencies.githubOAuth),
    bindOAuth: new BindOAuthUseCase(
      identityRepository,
      oauthStateStore,
      dependencies.githubOAuthClient,
    ),
    unbindOAuth: new UnbindOAuthUseCase(identityRepository),
    oauthStateStore,
  };
}

// ---------------------------------------------------------------------------
// Normalize runtime contributions — 规范化运行时贡献
// ---------------------------------------------------------------------------

/**
 * Map an OAuth provider name from the contract enum to a registry method id.
 * 将契约枚举中的 OAuth provider 名映射为注册表方式 id。
 *
 * Only GitHub is wired today; other providers fall through to their lowercase
 * name and will surface as SERVICE_UNAVAILABLE unless a provider is registered.
 * 目前仅接线 GitHub；其他 provider 回退为小写名，未注册时表现为 SERVICE_UNAVAILABLE。
 */
function oauthProviderToMethod(provider: OAuthCallbackReq['provider']): string {
  switch (provider) {
    case 'Github':
      return AuthenticationMethod.Github;
    default:
      return provider.toLowerCase();
  }
}

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

  // Build the transport-neutral facade — thin passthrough, no try/catch shim.
  // Use cases own error-to-Result conversion; unexpected errors propagate as throws.
  const api: AuthenticationApplicationPort = {
    register: (data, cx, deviceId) => useCases.register.execute(data, cx, deviceId),

    registerByPhone: async (_data, _cx) =>
      fail({
        code: 'SERVICE_UNAVAILABLE',
        message: 'Phone registration is not implemented on the server yet',
      }),

    login: (data, cx, deviceId) => useCases.login.execute(data, cx, deviceId),

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

    logout: (cx) => useCases.logout.execute(undefined as void, cx),

    refreshToken: (data, cx) => useCases.refreshToken.execute(data, cx),

    getCurrentUser: (cx, sessionId) =>
      useCases.getCurrentUser.execute(cx, sessionId),

    listSessions: (cx, sessionId) =>
      useCases.listSessions.execute(cx, sessionId),

    revokeSession: (data, cx) => useCases.revokeSession.execute(data, cx),

    changePassword: (data, cx) => useCases.changePassword.execute(data, cx),

    forgotPassword: (data) => useCases.forgotPassword.execute(data),

    resetPassword: (data) => useCases.resetPassword.execute(data),

    sendEmailCode: (data, cx) => useCases.sendEmailVerificationCode.execute(data, cx),

    verifyEmailCode: (data, cx) => useCases.verifyEmailCode.execute(data, cx),

    getOAuthUrl: (data) => useCases.getOAuthUrl.execute(data),

    listOAuthProviders: () => useCases.listOAuthProviders.execute(),

    bindOAuth: (data, cx) => useCases.bindOAuth.execute(data, cx),

    unbindOAuth: (data, cx) => useCases.unbindOAuth.execute(data, cx),

    // Pluggable OAuth login — dispatches to the provider registered under the
    // method id derived from the provider name (e.g. 'Github' -> 'github').
    // 可插拔 OAuth 登录 —— 分发到按 provider 名派生的方式 id 所注册的提供者。
    oauthCallback: async (data, cx, deviceId) => {
      const consumed = useCases.oauthStateStore.consume(data.state, data.provider);
      if (!consumed) {
        return fail({
          code: 'VALIDATION_ERROR',
          message: 'Invalid or expired OAuth state',
        });
      }
      return useCases.authenticate.execute(
        oauthProviderToMethod(data.provider),
        {
          code: data.code,
          state: data.state,
          codeVerifier: consumed.codeVerifier,
          redirectUri: consumed.redirectUri,
        },
        cx,
        deviceId,
      );
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

