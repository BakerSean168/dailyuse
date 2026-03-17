/**
 * Port interface for password reset code storage.
 * 密码重置验证码存储端口接口。
 *
 * Implementations may use in-memory maps, Redis, database tables, etc.
 */
export interface IPasswordResetCodeStore {
  /**
   * Generate and store a 6-digit code for the given email. Returns the code.
   * 为指定邮箱生成并存储一个6位验证码，返回该验证码。
   */
  generateCode(email: string): Promise<string>;

  /**
   * Verify a code for the given email. Returns true if valid and not expired.
   * Consumes the code on success (one-time use).
   * 验证指定邮箱的验证码。验证成功后消费该验证码（一次性使用）。
   */
  verifyCode(email: string, code: string): Promise<boolean>;
}
