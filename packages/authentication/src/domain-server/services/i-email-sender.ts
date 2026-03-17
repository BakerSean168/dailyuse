/**
 * Port interface for sending emails.
 * 邮件发送端口接口。
 *
 * Implementations may use SMTP, SendGrid, console logging (dev), etc.
 */
export interface IEmailSender {
  /**
   * Send a password reset verification code to the given email.
   * 向指定邮箱发送密码重置验证码。
   */
  sendPasswordResetCode(email: string, code: string): Promise<void>;
}
