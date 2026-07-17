import type { IEmailSender } from '../../domain';

/**
 * Console-based IEmailSender for local development.
 * 本地开发用的控制台邮件发送实现。
 *
 * Logs codes to the console. Replace with a real provider (SMTP, Resend, SES) in production.
 * 将验证码打印到控制台。生产环境替换为真实邮件服务。
 */
export class ConsoleEmailSender implements IEmailSender {
  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    console.log(`[PasswordReset] Code for ${email}: ${code}`);
  }

  async sendEmailVerificationCode(email: string, code: string): Promise<void> {
    console.log(`[EmailVerify] Code for ${email}: ${code}`);
  }
}
