/**
 * Pluggable Authentication Provider — 可插拔认证提供者抽象
 *
 * This is the abstract login contract every authentication method implements.
 * 这是每种登录方式都要实现的抽象登录契约。
 *
 * Design goal (ADR-034):
 * - Method-specific credential verification is pluggable (password / GitHub / guest / ...).
 * - The common part (Daily Use session issuance) lives in the application layer,
 *   so adding a new login method never duplicates session logic.
 *
 * 设计目标（ADR-034）：
 * - 各登录方式的凭据校验可插拔（账密 / GitHub / 访客 / ...）。
 * - 通用部分（签发 Daily Use 会话）留在应用层，新增登录方式无需重复会话逻辑。
 */

import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { AuthIdentity } from '../aggregates/auth-identity';

/**
 * Well-known authentication method identifiers.
 * 已知的认证方式标识。
 *
 * The registry accepts any string id, so third parties can register additional
 * methods without editing this list — this is the open/extensible seam.
 * 注册表接受任意字符串 id，第三方可注册额外方式而无需修改此列表 —— 这是开放扩展点。
 */
export const AuthenticationMethod = {
  Password: 'password',
  Github: 'github',
  Guest: 'guest',
} as const;

export type AuthenticationMethod =
  (typeof AuthenticationMethod)[keyof typeof AuthenticationMethod] | (string & {});

/**
 * Ambient context handed to every provider.
 * 传给每个提供者的环境上下文。
 */
export interface AuthenticationContext {
  /** Stable per-device identifier used for session/device binding. */
  readonly deviceId: string;
  /** Transport-neutral execution context (locale, request id, ...). */
  readonly cx: ExecutionContext;
}

/**
 * Result of a successful provider authentication.
 * 提供者认证成功后的结果。
 *
 * A provider only proves *who the user is* (returns a verified identity).
 * Session issuance is the application layer's shared responsibility.
 * 提供者只负责证明"用户是谁"（返回已验证身份），会话签发由应用层统一负责。
 */
export interface AuthenticationResult {
  readonly identity: AuthIdentity;
  /**
   * True when a brand-new identity was provisioned during this authentication,
   * e.g. a first-time GitHub login. Password login never provisions here.
   * 本次认证是否新建了身份（如首次 GitHub 登录）。账密登录不会在此新建。
   */
  readonly isNewIdentity: boolean;
}

/**
 * The pluggable login contract.
 * 可插拔登录契约。
 *
 * Implementations MUST:
 * - throw domain errors on failure (never return a Result — that is the use case's job);
 * - never issue Daily Use sessions or tokens;
 * - keep verification side effects (failed-attempt counters, binding usage) inside the aggregate.
 *
 * 实现必须：
 * - 失败时抛出领域错误（不返回 Result —— 那是 use case 的职责）；
 * - 不签发 Daily Use 会话或令牌；
 * - 校验副作用（失败计数、绑定使用记录）放在聚合内。
 */
export interface AuthenticationProvider<TCredentials = unknown> {
  /** Method identifier this provider handles, e.g. 'password' or 'github'. */
  readonly method: AuthenticationMethod;
  /** Verify credentials and resolve a verified identity. */
  authenticate(
    credentials: TCredentials,
    context: AuthenticationContext,
  ): Promise<AuthenticationResult>;
}

/**
 * Raised when no provider is registered for a requested method.
 * 请求的登录方式没有注册对应提供者时抛出。
 */
export class UnsupportedAuthenticationMethodError extends Error {
  constructor(public readonly method: string) {
    super(`No authentication provider registered for method [${method}].`);
    this.name = 'UnsupportedAuthenticationMethodError';
  }
}

/**
 * Raised when a provider is registered twice under the same method id.
 * 同一方式 id 重复注册提供者时抛出。
 */
export class DuplicateAuthenticationProviderError extends Error {
  constructor(public readonly method: string) {
    super(`Authentication provider for method [${method}] is already registered.`);
    this.name = 'DuplicateAuthenticationProviderError';
  }
}

export class AccountLinkRequiredError extends Error {
  constructor(
    public readonly method: string,
    public readonly email: string,
  ) {
    super(`An identity already exists for the email returned by [${method}].`);
    this.name = 'AccountLinkRequiredError';
  }
}

export class OAuthEmailRequiredError extends Error {
  constructor(public readonly method: string) {
    super(`Authentication method [${method}] did not return a verified email.`);
    this.name = 'OAuthEmailRequiredError';
  }
}
