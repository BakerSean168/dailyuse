/**
 * Port interface for sending transactional authentication emails.
 * 认证事务邮件发送端口。
 *
 * Implementations may use SMTP, Resend, SES, console logging (dev), etc.
 */
export interface IEmailSender {
  /**
   * Send a password reset verification code.
   * 发送密码重置验证码。
   */
  sendPasswordResetCode(email: string, code: string): Promise<void>;

  /**
   * Send an email ownership verification code (register / bind / change).
   * 发送邮箱归属验证码（注册验证 / 绑定 / 换绑）。
   */
  sendEmailVerificationCode(email: string, code: string): Promise<void>;
}
