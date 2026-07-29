/**
 * Resolve IEmailSender from env: console (default) | smtp | resend.
 * Optional secondary SMTP for failover when SMTP_SECONDARY_* is complete.
 *
 * local-docker runs NODE_ENV=production — never infer provider from NODE_ENV alone.
 */

import type { IEmailSender } from '../../domain';
import { ConsoleEmailSender } from './console-email-sender';
import { FailoverEmailSender } from './failover-email-sender';
import { ResendEmailSender, type ResendFetch } from './resend-email-sender';
import {
  SmtpEmailSender,
  type SmtpEmailSenderConfig,
  type SmtpMailTransport,
} from './smtp-email-sender';

export type EmailProvider = 'console' | 'smtp' | 'resend';

export type EmailSenderEnv = {
  EMAIL_PROVIDER?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string | number;
  SMTP_SECURE?: string | boolean;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
  SMTP_REPLY_TO?: string;
  /** zh | en template locale */
  SMTP_LOCALE?: string;
  EMAIL_LOCALE?: string;
  /** Resend HTTP API */
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  /** Optional secondary SMTP (failover after primary smtp/resend failure) */
  SMTP_SECONDARY_HOST?: string;
  SMTP_SECONDARY_PORT?: string | number;
  SMTP_SECONDARY_SECURE?: string | boolean;
  SMTP_SECONDARY_USER?: string;
  SMTP_SECONDARY_PASS?: string;
  SMTP_SECONDARY_FROM?: string;
  /** When set with smtp/resend, dual-write codes to console capture for last-email-code. */
  LOCAL_VALIDATION?: string;
  EMAIL_CAPTURE_CODES?: string;
};

export type CreateEmailSenderOptions = {
  /** Override process env (tests). */
  env?: EmailSenderEnv;
  /** Inject nodemailer-compatible transport (tests). */
  smtpTransport?: SmtpMailTransport;
  /** Secondary SMTP transport (tests). */
  secondarySmtpTransport?: SmtpMailTransport;
  /** Inject Resend fetch (tests). */
  resendFetch?: ResendFetch;
};

export class IncompleteSmtpConfigError extends Error {
  readonly code = 'INCOMPLETE_SMTP_CONFIG';

  constructor(missing: readonly string[]) {
    super(
      `EMAIL_PROVIDER=smtp requires ${missing.join(', ')}. ` +
        `Set them in env or use EMAIL_PROVIDER=console.`,
    );
    this.name = 'IncompleteSmtpConfigError';
  }
}

export class IncompleteResendConfigError extends Error {
  readonly code = 'INCOMPLETE_RESEND_CONFIG';

  constructor(missing: readonly string[]) {
    super(
      `EMAIL_PROVIDER=resend requires ${missing.join(', ')}. ` +
        `Set them in env or use EMAIL_PROVIDER=console.`,
    );
    this.name = 'IncompleteResendConfigError';
  }
}

/**
 * Explicit provider only. Unset / unknown → console (safe default for CI & local-docker).
 */
export function resolveEmailProvider(env: EmailSenderEnv = process.env): EmailProvider {
  const raw = (env.EMAIL_PROVIDER ?? '').trim().toLowerCase();
  if (raw === 'smtp') return 'smtp';
  if (raw === 'resend') return 'resend';
  if (raw === 'console') return 'console';
  return 'console';
}

/**
 * Accept `addr@domain` or `Display Name <addr@domain>` (common SMTP From form).
 * env.schema historically used z.string().email() which rejects display-name form.
 */
export function isValidSmtpFrom(from: string): boolean {
  const trimmed = from.trim();
  if (!trimmed) return false;
  const angle = trimmed.match(/^(.+?)\s*<([^>]+)>$/u);
  const addr = (angle ? angle[2] : trimmed).trim();
  // Practical RFC-ish check (same spirit as EmailAddress, not full RFC 5322).
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(addr) && addr.length <= 254;
}

function parsePort(portRaw: string | number | undefined, fallback: number): number {
  if (typeof portRaw === 'number' && Number.isFinite(portRaw)) return portRaw;
  return Number.parseInt(String(portRaw ?? fallback), 10) || fallback;
}

function parseSecure(secureRaw: string | boolean | undefined, port: number): boolean {
  return (
    secureRaw === true ||
    secureRaw === 'true' ||
    secureRaw === '1' ||
    port === 465
  );
}

export function assertSmtpConfig(env: EmailSenderEnv): SmtpEmailSenderConfig {
  const missing: string[] = [];
  const host = (env.SMTP_HOST ?? '').trim();
  const user = (env.SMTP_USER ?? '').trim();
  const pass = env.SMTP_PASS ?? '';
  const from = (env.SMTP_FROM ?? '').trim();

  if (!host) missing.push('SMTP_HOST');
  if (!user) missing.push('SMTP_USER');
  if (!pass) missing.push('SMTP_PASS');
  if (!from) missing.push('SMTP_FROM');
  if (missing.length > 0) {
    throw new IncompleteSmtpConfigError(missing);
  }
  if (!isValidSmtpFrom(from)) {
    throw new IncompleteSmtpConfigError([
      'SMTP_FROM (must be email or "Name <email@domain>")',
    ]);
  }

  const port = parsePort(env.SMTP_PORT, 587);
  const secure = parseSecure(env.SMTP_SECURE, port);
  const replyTo = (env.SMTP_REPLY_TO ?? '').trim() || undefined;
  const locale = (env.SMTP_LOCALE ?? env.EMAIL_LOCALE ?? '').trim() || undefined;

  return {
    host,
    port,
    secure,
    user,
    pass: String(pass),
    from,
    replyTo,
    locale,
  };
}

function trySecondarySmtpConfig(env: EmailSenderEnv): SmtpEmailSenderConfig | null {
  const host = (env.SMTP_SECONDARY_HOST ?? '').trim();
  const user = (env.SMTP_SECONDARY_USER ?? '').trim();
  const pass = env.SMTP_SECONDARY_PASS ?? '';
  const from = (env.SMTP_SECONDARY_FROM ?? env.SMTP_FROM ?? '').trim();
  if (!host || !user || !pass || !from || !isValidSmtpFrom(from)) {
    return null;
  }
  const port = parsePort(env.SMTP_SECONDARY_PORT, 587);
  const secure = parseSecure(env.SMTP_SECONDARY_SECURE, port);
  const locale = (env.SMTP_LOCALE ?? env.EMAIL_LOCALE ?? '').trim() || undefined;
  return {
    host,
    port,
    secure,
    user,
    pass: String(pass),
    from,
    locale,
  };
}

export function assertResendConfig(env: EmailSenderEnv): {
  apiKey: string;
  from: string;
  replyTo?: string;
  locale?: string;
} {
  const missing: string[] = [];
  const apiKey = (env.RESEND_API_KEY ?? '').trim();
  const from = (env.RESEND_FROM ?? env.SMTP_FROM ?? '').trim();
  if (!apiKey) missing.push('RESEND_API_KEY');
  if (!from) missing.push('RESEND_FROM or SMTP_FROM');
  if (missing.length > 0) {
    throw new IncompleteResendConfigError(missing);
  }
  if (!isValidSmtpFrom(from)) {
    throw new IncompleteResendConfigError([
      'RESEND_FROM (must be email or "Name <email@domain>")',
    ]);
  }
  const replyTo = (env.SMTP_REPLY_TO ?? '').trim() || undefined;
  const locale = (env.SMTP_LOCALE ?? env.EMAIL_LOCALE ?? '').trim() || undefined;
  return { apiKey, from, replyTo, locale };
}

function shouldCaptureCodes(env: EmailSenderEnv): boolean {
  const local =
    env.LOCAL_VALIDATION === '1' ||
    env.LOCAL_VALIDATION === 'true' ||
    env.EMAIL_CAPTURE_CODES === '1' ||
    env.EMAIL_CAPTURE_CODES === 'true';
  return local;
}

function maybeWrapFailover(
  primary: IEmailSender,
  env: EmailSenderEnv,
  options: CreateEmailSenderOptions,
): IEmailSender {
  const secondaryCfg = trySecondarySmtpConfig(env);
  if (!secondaryCfg) {
    return primary;
  }
  const secondary = new SmtpEmailSender(
    { ...secondaryCfg, captureCodes: shouldCaptureCodes(env) },
    options.secondarySmtpTransport,
  );
  return new FailoverEmailSender(primary, secondary);
}

/**
 * Factory: console by default; smtp / resend when configured; optional secondary SMTP failover.
 */
export function createEmailSender(options: CreateEmailSenderOptions = {}): IEmailSender {
  const env = options.env ?? process.env;
  const provider = resolveEmailProvider(env);
  const captureCodes = shouldCaptureCodes(env);

  if (provider === 'smtp') {
    const config = assertSmtpConfig(env);
    const primary = new SmtpEmailSender(
      { ...config, captureCodes },
      options.smtpTransport,
    );
    return maybeWrapFailover(primary, env, options);
  }

  if (provider === 'resend') {
    const config = assertResendConfig(env);
    const primary = new ResendEmailSender(
      { ...config, captureCodes },
      options.resendFetch,
    );
    return maybeWrapFailover(primary, env, options);
  }

  return new ConsoleEmailSender();
}
