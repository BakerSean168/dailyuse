import type { IEmailSender } from '@/domain-server/services/i-email-sender';

/**
 * Console-based implementation of IEmailSender.
 * 基于控制台的邮件发送实现（开发占位符）。
 *
 * Logs the password reset code to the console.
 * Replace with a real email service (SMTP, SendGrid, etc.) for production.
 */
export class ConsoleEmailSender implements IEmailSender {
  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    console.log(`[PasswordReset] Code for ${email}: ${code}`);
  }
}
