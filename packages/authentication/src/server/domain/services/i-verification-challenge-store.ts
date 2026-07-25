/**
 * Verification challenge purposes shared by password reset, email verify, bind/change.
 * 密码重置、邮箱验证、绑定/换绑共用的 challenge purpose。
 */
export const VerificationChallengePurpose = {
  PasswordReset: 'PasswordReset',
  EmailVerify: 'EmailVerify',
  EmailBind: 'EmailBind',
  EmailChange: 'EmailChange',
} as const;

export type VerificationChallengePurpose =
  (typeof VerificationChallengePurpose)[keyof typeof VerificationChallengePurpose];

/**
 * Stable domain codes for auth challenge / verification flows.
 * 认证 challenge / 验证流程的稳定领域错误码（可放入 Result.context.domainCode）。
 */
export const AuthDomainCode = {
  INVALID_OR_EXPIRED_CODE: 'INVALID_OR_EXPIRED_CODE',
  EMAIL_VERIFICATION_REQUIRED: 'EMAIL_VERIFICATION_REQUIRED',
  CHALLENGE_COOLDOWN: 'CHALLENGE_COOLDOWN',
  CHALLENGE_RATE_LIMITED: 'CHALLENGE_RATE_LIMITED',
  /** OAuth subject already bound to a different identity — no silent merge. */
  OAUTH_ALREADY_LINKED: 'OAUTH_ALREADY_LINKED',
  /** Provider email belongs to an existing identity and requires explicit linking. */
  ACCOUNT_LINK_REQUIRED: 'ACCOUNT_LINK_REQUIRED',
  /** Provider did not return a verified email required to provision Account. */
  OAUTH_EMAIL_REQUIRED: 'OAUTH_EMAIL_REQUIRED',
  /** Cannot remove the last login path (password or OAuth). */
  LAST_LOGIN_PATH: 'LAST_LOGIN_PATH',
} as const;

export type AuthDomainCode = (typeof AuthDomainCode)[keyof typeof AuthDomainCode];

export interface IssueVerificationChallengeParams {
  readonly purpose: VerificationChallengePurpose;
  /** Normalized by the store (e.g. lowercased email). */
  readonly subject: string;
  readonly identityId?: string;
}

export interface ConsumeVerificationChallengeParams {
  readonly purpose: VerificationChallengePurpose;
  readonly subject: string;
  readonly challenge: string;
}

/**
 * Port for issuing and consuming one-time verification challenges (OTP / token).
 * 一次性验证挑战（验证码 / 令牌）的签发与消费端口。
 *
 * Implementations store only a hash of the challenge, never the plaintext.
 * 实现只持久化 challenge 哈希，不保存明文。
 */
export interface IVerificationChallengeStore {
  /**
   * Issue a new challenge and return the plaintext (only for delivery channels).
   * 签发新 challenge，返回明文（仅用于发信等投递通道）。
   *
   * @throws {ChallengeCooldownError} when re-issue is too soon
   * @throws {ChallengeRateLimitError} when daily issue budget is exhausted
   */
  issue(params: IssueVerificationChallengeParams): Promise<string>;

  /**
   * Consume a challenge. Returns true only when valid; always one-time on success.
   * 消费 challenge。仅有效时返回 true；成功后立即失效。
   */
  consume(params: ConsumeVerificationChallengeParams): Promise<boolean>;
}

export class ChallengeCooldownError extends Error {
  readonly domainCode = AuthDomainCode.CHALLENGE_COOLDOWN;
  readonly retryAfterMs: number;

  constructor(retryAfterMs: number) {
    super(`Verification challenge cooldown active; retry after ${retryAfterMs}ms`);
    this.name = 'ChallengeCooldownError';
    this.retryAfterMs = retryAfterMs;
  }
}

export class ChallengeRateLimitError extends Error {
  readonly domainCode = AuthDomainCode.CHALLENGE_RATE_LIMITED;

  constructor(message = 'Verification challenge daily limit exceeded') {
    super(message);
    this.name = 'ChallengeRateLimitError';
  }
}
