/**
 * GitHub OAuth Client Port — GitHub OAuth 客户端端口
 *
 * The pluggable seam between the GitHub login provider and the concrete
 * GitHub API integration. Keeping this as a domain-level port means:
 * - the provider stays testable without real network calls;
 * - the concrete client (GitHub App user authorization) lives in infrastructure;
 * - swapping GitHub App / OAuth App implementations never touches the provider.
 *
 * 这是 GitHub 登录提供者与具体 GitHub API 集成之间的可插拔接缝。将其作为
 * 领域级端口意味着：提供者无需真实网络即可测试；具体客户端（GitHub App
 * user authorization）落在基础设施层；替换实现不触及提供者。
 *
 * ADR-034 constraint: login authorization requests ONLY the minimal identity
 * information and never the repository Contents permission. Repository
 * connection is a separate, explicit authorization.
 * ADR-034 约束：登录授权只请求最小身份信息，绝不申请仓库 Contents 权限；
 * 仓库连接是独立、明确的授权。
 */

/**
 * Stable GitHub identity resolved from an authorization code.
 * 从授权码解析出的稳定 GitHub 身份。
 */
export interface GithubUserIdentity {
  /**
   * GitHub numeric user ID — the stable OAuth subject.
   * Never use the mutable login/username or a potentially hidden email as the key.
   * GitHub 数字 user ID —— 稳定的 OAuth subject。
   * 不要用可变用户名或可能隐藏的邮箱作为唯一键。
   */
  readonly subjectId: string;
  /** GitHub login/username, for display only (may change over time). */
  readonly username?: string;
  /** Primary email if the user chose to expose it, for display/linking only. */
  readonly email?: string | null;
}

/**
 * Exchanges a GitHub authorization code (+ state) for a stable identity.
 * 用 GitHub 授权码（+ state）换取稳定身份。
 */
export interface IGithubOAuthClient {
  /**
   * Verify the authorization code and return the stable GitHub identity.
   * @throws when the code/state is invalid or the exchange fails.
   */
  exchangeCodeForIdentity(params: {
    code: string;
    state?: string;
    redirectUri?: string;
    codeVerifier?: string;
  }): Promise<GithubUserIdentity>;
}
