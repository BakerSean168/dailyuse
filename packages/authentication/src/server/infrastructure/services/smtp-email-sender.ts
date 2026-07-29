/**
 * Generic SMTP IEmailSender (nodemailer).
 * Vendor-agnostic: Brevo, Mailgun, corporate relays, etc. via SMTP_* env.
 *
 * Plaintext verification codes appear only in the mail body — never in logs.
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { IEmailSender } from '../../domain';
import { maskEmail } from '../../shared/mask-email';
import { ConsoleEmailSender } from './console-email-sender';
import {
  buildTransactionalEmail,
  type EmailTemplateKind,
} from './email-templates';

export type SmtpEmailSenderConfig = {
  readonly host: string;
  readonly port: number;
  readonly secure: boolean;
  readonly user: string;
  readonly pass: string;
  readonly from: string;
  /** Optional reply-to header. */
  readonly replyTo?: string;
  /**
   * When true, also record codes into ConsoleEmailSender capture buffer
   * (local-docker / LOCAL_VALIDATION last-email-code). Never enable in true prod.
   */
  readonly captureCodes?: boolean;
  /** Template locale: zh | en (SMTP_LOCALE / EMAIL_LOCALE). */
  readonly locale?: string;
};

/** Minimal transport surface used in production and unit tests. */
export type SmtpMailTransport = {
  sendMail(options: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html?: string;
    replyTo?: string;
  }): Promise<unknown>;
};

export class SmtpEmailSender implements IEmailSender {
  private readonly transport: SmtpMailTransport;
  private readonly from: string;
  private readonly replyTo?: string;
  private readonly captureCodes: boolean;
  private readonly locale?: string;

  constructor(
    config: SmtpEmailSenderConfig,
    /** Injectable for unit tests; defaults to nodemailer SMTP transport. */
    transport?: SmtpMailTransport,
  ) {
    this.from = config.from;
    this.replyTo = config.replyTo;
    this.captureCodes = config.captureCodes === true;
    this.locale = config.locale;
    this.transport =
      transport ??
      (nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.pass,
        },
      }) as Transporter as SmtpMailTransport);
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

    await this.transport.sendMail({
      from: this.from,
      to: normalized,
      subject,
      text,
      html,
      ...(this.replyTo ? { replyTo: this.replyTo } : {}),
    });

    if (this.captureCodes) {
      ConsoleEmailSender.record({
        kind,
        email: normalized,
        code,
        sentAt: Date.now(),
      });
    }

    // Security: mask email, never log plaintext code.
    const tag = kind === 'email-verify' ? 'EmailVerify' : 'PasswordReset';
    console.log(`[${tag}] SMTP code issued for ${maskEmail(normalized)}`);
  }
}
