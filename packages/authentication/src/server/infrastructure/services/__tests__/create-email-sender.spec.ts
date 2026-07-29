import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  assertSmtpConfig,
  createEmailSender,
  IncompleteSmtpConfigError,
  isValidSmtpFrom,
  resolveEmailProvider,
} from '../create-email-sender';
import { ConsoleEmailSender } from '../console-email-sender';
import { SmtpEmailSender } from '../smtp-email-sender';
import type { SmtpMailTransport } from '../smtp-email-sender';

describe('resolveEmailProvider', () => {
  it('defaults to console when unset or unknown', () => {
    expect(resolveEmailProvider({})).toBe('console');
    expect(resolveEmailProvider({ EMAIL_PROVIDER: '' })).toBe('console');
    expect(resolveEmailProvider({ EMAIL_PROVIDER: 'ses' })).toBe('console');
  });

  it('honors explicit console, smtp, and resend (case-insensitive)', () => {
    expect(resolveEmailProvider({ EMAIL_PROVIDER: 'console' })).toBe('console');
    expect(resolveEmailProvider({ EMAIL_PROVIDER: 'SMTP' })).toBe('smtp');
    expect(resolveEmailProvider({ EMAIL_PROVIDER: 'Resend' })).toBe('resend');
  });

  it('does not treat NODE_ENV as provider (local-docker production stays console unless set)', () => {
    expect(resolveEmailProvider({ EMAIL_PROVIDER: undefined })).toBe('console');
  });
});

describe('isValidSmtpFrom / assertSmtpConfig', () => {
  it('accepts bare email and display-name From', () => {
    expect(isValidSmtpFrom('noreply@mail.example.com')).toBe(true);
    expect(isValidSmtpFrom('MemoFlow <noreply@send.example.com>')).toBe(true);
    expect(isValidSmtpFrom('not-an-email')).toBe(false);
    expect(isValidSmtpFrom('')).toBe(false);
  });

  it('throws IncompleteSmtpConfigError listing missing fields', () => {
    expect(() => assertSmtpConfig({ EMAIL_PROVIDER: 'smtp' })).toThrow(IncompleteSmtpConfigError);
    try {
      assertSmtpConfig({ EMAIL_PROVIDER: 'smtp', SMTP_HOST: 'h' });
    } catch (e) {
      expect(e).toBeInstanceOf(IncompleteSmtpConfigError);
      expect((e as Error).message).toContain('SMTP_USER');
      expect((e as Error).message).toContain('SMTP_PASS');
      expect((e as Error).message).toContain('SMTP_FROM');
    }
  });

  it('builds config with port 465 implying secure', () => {
    const cfg = assertSmtpConfig({
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '465',
      SMTP_USER: 'u',
      SMTP_PASS: 'p',
      SMTP_FROM: 'App <a@b.co>',
    });
    expect(cfg.port).toBe(465);
    expect(cfg.secure).toBe(true);
    expect(cfg.from).toBe('App <a@b.co>');
  });
});

describe('createEmailSender', () => {
  afterEach(() => {
    ConsoleEmailSender.clearForTests();
  });

  it('returns ConsoleEmailSender by default', () => {
    const sender = createEmailSender({ env: {} });
    expect(sender).toBeInstanceOf(ConsoleEmailSender);
  });

  it('returns SmtpEmailSender when provider=smtp and config complete', async () => {
    const sendMail = vi.fn().mockResolvedValue({ messageId: 'test' });
    const transport: SmtpMailTransport = { sendMail };

    const sender = createEmailSender({
      env: {
        EMAIL_PROVIDER: 'smtp',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_USER: 'user',
        SMTP_PASS: 'pass',
        SMTP_FROM: 'Memoflow <noreply@mail.example.com>',
      },
      smtpTransport: transport,
    });

    expect(sender).toBeInstanceOf(SmtpEmailSender);
    await sender.sendEmailVerificationCode('User@Example.COM', '123456');

    expect(sendMail).toHaveBeenCalledTimes(1);
    const arg = sendMail.mock.calls[0][0];
    expect(arg.to).toBe('user@example.com');
    expect(arg.from).toBe('Memoflow <noreply@mail.example.com>');
    expect(arg.subject).toMatch(/验证码|verification/i);
    expect(arg.text).toContain('123456');
    expect(arg.html).toContain('123456');
  });

  it('rejects incomplete smtp config at create time', () => {
    expect(() =>
      createEmailSender({
        env: { EMAIL_PROVIDER: 'smtp', SMTP_HOST: 'only-host' },
      }),
    ).toThrow(IncompleteSmtpConfigError);
  });

  it('smtp + LOCAL_VALIDATION dual-writes to console capture for last-email-code', async () => {
    ConsoleEmailSender.clearForTests();
    const sendMail = vi.fn().mockResolvedValue({});
    const sender = createEmailSender({
      env: {
        EMAIL_PROVIDER: 'smtp',
        LOCAL_VALIDATION: '1',
        SMTP_HOST: 'smtp.example.com',
        SMTP_USER: 'u',
        SMTP_PASS: 'p',
        SMTP_FROM: 'a@b.co',
      },
      smtpTransport: { sendMail },
    });

    await sender.sendEmailVerificationCode('capture@test.com', '654321');
    expect(ConsoleEmailSender.getLatestCode('capture@test.com', 'email-verify')).toBe('654321');
  });
});

describe('ConsoleEmailSender golden path (last-email-code)', () => {
  afterEach(() => {
    ConsoleEmailSender.clearForTests();
  });

  it('returns non-null code for same normalized email after send', async () => {
    const sender = new ConsoleEmailSender();
    await sender.sendEmailVerificationCode('Test@Example.COM', '998877');
    expect(ConsoleEmailSender.getLatestCode('test@example.com')).toBe('998877');
    expect(ConsoleEmailSender.getLatestCode('test@example.com', 'email-verify')).toBe('998877');
    expect(ConsoleEmailSender.getLatestCode('other@example.com')).toBeNull();
  });

  it('password-reset kind is isolated from email-verify', async () => {
    const sender = new ConsoleEmailSender();
    await sender.sendEmailVerificationCode('a@b.co', '111111');
    await sender.sendPasswordResetCode('a@b.co', '222222');
    expect(ConsoleEmailSender.getLatestCode('a@b.co', 'email-verify')).toBe('111111');
    expect(ConsoleEmailSender.getLatestCode('a@b.co', 'password-reset')).toBe('222222');
    expect(ConsoleEmailSender.getLatestCode('a@b.co')).toBe('222222');
  });
});

describe('SmtpEmailSender log hygiene', () => {
  it('logs masked email and never includes plaintext code in log line', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const sendMail = vi.fn().mockResolvedValue({});
    const sender = new SmtpEmailSender(
      {
        host: 'h',
        port: 587,
        secure: false,
        user: 'u',
        pass: 'p',
        from: 'f@e.co',
      },
      { sendMail },
    );

    await sender.sendEmailVerificationCode('alice@example.com', 'SECRET99');

    const lines = log.mock.calls.map((c) => String(c[0]));
    expect(lines.some((l) => l.includes('EmailVerify') && l.includes('a***e@example.com'))).toBe(
      true,
    );
    expect(lines.every((l) => !l.includes('SECRET99'))).toBe(true);
    log.mockRestore();
  });
});
