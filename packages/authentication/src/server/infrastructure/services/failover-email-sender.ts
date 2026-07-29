/**
 * Sequential failover IEmailSender: try primary, on failure try secondary.
 * Logs masked failures only — never plaintext codes.
 */

import type { IEmailSender } from '../../domain';
import { maskEmail } from '../../shared/mask-email';

export class FailoverEmailSender implements IEmailSender {
  constructor(
    private readonly primary: IEmailSender,
    private readonly secondary: IEmailSender,
    private readonly label = 'email-failover',
  ) {}

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    await this.withFailover(email, 'password-reset', () =>
      this.primary.sendPasswordResetCode(email, code),
      () => this.secondary.sendPasswordResetCode(email, code),
    );
  }

  async sendEmailVerificationCode(email: string, code: string): Promise<void> {
    await this.withFailover(email, 'email-verify', () =>
      this.primary.sendEmailVerificationCode(email, code),
      () => this.secondary.sendEmailVerificationCode(email, code),
    );
  }

  private async withFailover(
    email: string,
    kind: string,
    primaryFn: () => Promise<void>,
    secondaryFn: () => Promise<void>,
  ): Promise<void> {
    try {
      await primaryFn();
    } catch (primaryError) {
      const masked = maskEmail(email.trim().toLowerCase());
      const msg =
        primaryError instanceof Error ? primaryError.message : String(primaryError);
      console.warn(
        `[${this.label}] primary failed for ${kind} to ${masked}: ${msg}; trying secondary`,
      );
      try {
        await secondaryFn();
      } catch (secondaryError) {
        const sMsg =
          secondaryError instanceof Error ? secondaryError.message : String(secondaryError);
        console.error(
          `[${this.label}] secondary also failed for ${kind} to ${masked}: ${sMsg}`,
        );
        throw secondaryError;
      }
    }
  }
}
