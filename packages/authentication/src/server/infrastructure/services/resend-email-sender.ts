/**
 * Resend HTTP API IEmailSender (optional EMAIL_PROVIDER=resend).
 *
 * Uses fetch only — no Resend SDK. Codes only in mail body; logs mask email.
 */

import type { IEmailSender } from '../../domain';
import { maskEmail } from '../../shared/mask-email';
import { ConsoleEmailSender } from './console-email-sender';
import {
  buildTransactionalEmail,
  type EmailTemplateKind,
} from './email-templates';

export type ResendEmailSenderConfig = {
  readonly apiKey: string;
  readonly from: string;
  readonly replyTo?: string;
  readonly captureCodes?: boolean;
  readonly locale?: string;
  /** Override API base (tests). Default https://api.resend.com */
  readonly apiBaseUrl?: string;
};

/** Injectable fetch for unit tests. */
export type ResendFetch = (
  input: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body: string;
  },
) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

export class ResendEmailSender implements IEmailSender {
  private readonly apiKey: string;
  private readonly from: string;
  private readonly replyTo?: string;
  private readonly captureCodes: boolean;
  private readonly locale?: string;
  private readonly apiBaseUrl: string;
  private readonly fetchImpl: ResendFetch;

  constructor(config: ResendEmailSenderConfig, fetchImpl?: ResendFetch) {
    this.apiKey = config.apiKey;
    this.from = config.from;
    this.replyTo = config.replyTo;
    this.captureCodes = config.captureCodes === true;
    this.locale = config.locale;
    this.apiBaseUrl = (config.apiBaseUrl ?? 'https://api.resend.com').replace(/\/$/, '');
    this.fetchImpl =
      fetchImpl ??
      ((globalThis.fetch as ResendFetch | undefined) ??
        (() => {
          throw new Error('ResendEmailSender requires global fetch or an injected fetchImpl');
        }));
  }

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    await this.dispatch(email, code, 'password-reset');
  }

  async sendEmailVerificationCode(email: string, code: string): Promise<void> {
    await this.dispatch(email, code, 'email-verify');
  }

  private async dispatch(
    email: string,
    code: string,
    kind: EmailTemplateKind,
  ): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const { subject, text, html } = buildTransactionalEmail(kind, code, this.locale);

    const body: Record<string, unknown> = {
      from: this.from,
      to: [normalized],
      subject,
      text,
      html,
    };
    if (this.replyTo) {
      body.reply_to = this.replyTo;
    }

    const res = await this.fetchImpl(`${this.apiBaseUrl}/emails`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(
        `Resend API failed with status ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`,
      );
    }

    if (this.captureCodes) {
      ConsoleEmailSender.record({
        kind,
        email: normalized,
        code,
        sentAt: Date.now(),
      });
    }

    const tag = kind === 'email-verify' ? 'EmailVerify' : 'PasswordReset';
    console.log(`[${tag}] Resend code issued for ${maskEmail(normalized)}`);
  }
}
