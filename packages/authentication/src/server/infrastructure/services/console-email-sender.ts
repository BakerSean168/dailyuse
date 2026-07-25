import type { IEmailSender } from '../../domain';
// Residual 949: maskEmail dual retired — sole server shared mask-email helper.
import { maskEmail } from '../../shared/mask-email';

export type CapturedAuthEmail = {
  readonly kind: 'password-reset' | 'email-verify';
  readonly email: string;
  readonly code: string;
  readonly sentAt: number;
};

/**
 * Console-based IEmailSender for local development / e2e.
 * 本地开发与 e2e 用的控制台邮件发送实现。
 *
 * Logs only masked emails and never prints plaintext codes. Codes remain in an
 * in-memory ring buffer so test lanes can read them via the test-only API.
 * 日志只写掩码邮箱，从不打印明文验证码；码保留在内存环形缓冲，测试车道通过
 * 仅测试 API 读取。
 */
export class ConsoleEmailSender implements IEmailSender {
  private static readonly MAX_ENTRIES = 50;
  private static readonly captures: CapturedAuthEmail[] = [];

  static record(entry: CapturedAuthEmail): void {
    ConsoleEmailSender.captures.push(entry);
    if (ConsoleEmailSender.captures.length > ConsoleEmailSender.MAX_ENTRIES) {
      ConsoleEmailSender.captures.splice(
        0,
        ConsoleEmailSender.captures.length - ConsoleEmailSender.MAX_ENTRIES,
      );
    }
  }

  static getLatestCode(
    email: string,
    kind?: CapturedAuthEmail['kind'],
  ): string | null {
    const normalized = email.trim().toLowerCase();
    for (let i = ConsoleEmailSender.captures.length - 1; i >= 0; i -= 1) {
      const entry = ConsoleEmailSender.captures[i];
      if (entry.email !== normalized) continue;
      if (kind && entry.kind !== kind) continue;
      return entry.code;
    }
    return null;
  }

  static clearForTests(): void {
    ConsoleEmailSender.captures.length = 0;
  }

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    ConsoleEmailSender.record({
      kind: 'password-reset',
      email: normalized,
      code,
      sentAt: Date.now(),
    });
    // Security checklist: mask email, never log plaintext code.
    console.log(`[PasswordReset] Code issued for ${maskEmail(normalized)}`);
  }

  async sendEmailVerificationCode(email: string, code: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    ConsoleEmailSender.record({
      kind: 'email-verify',
      email: normalized,
      code,
      sentAt: Date.now(),
    });
    console.log(`[EmailVerify] Code issued for ${maskEmail(normalized)}`);
  }
}
