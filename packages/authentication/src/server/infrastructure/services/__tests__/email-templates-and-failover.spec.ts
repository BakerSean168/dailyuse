import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  assertResendConfig,
  createEmailSender,
  IncompleteResendConfigError,
  resolveEmailProvider,
} from '../create-email-sender';
import { buildTransactionalEmail, resolveEmailTemplateLocale } from '../email-templates';
import { FailoverEmailSender } from '../failover-email-sender';
import { ResendEmailSender } from '../resend-email-sender';
import { ConsoleEmailSender } from '../console-email-sender';
import type { IEmailSender } from '../../../domain';
import type { SmtpMailTransport } from '../smtp-email-sender';

describe('email templates', () => {
  it('resolves locale', () => {
    expect(resolveEmailTemplateLocale('en')).toBe('en');
    expect(resolveEmailTemplateLocale('zh-CN')).toBe('zh');
    expect(resolveEmailTemplateLocale(undefined)).toBe('zh');
  });

  it('builds zh and en content with code only in body', () => {
    const zh = buildTransactionalEmail('email-verify', '123456', 'zh');
    expect(zh.subject).toContain('验证码');
    expect(zh.text).toContain('123456');
    expect(zh.html).toContain('123456');

    const en = buildTransactionalEmail('password-reset', '654321', 'en');
    expect(en.subject.toLowerCase()).toContain('password');
    expect(en.text).toContain('654321');
    expect(en.subject).not.toContain('654321');
  });
});

describe('resolveEmailProvider resend', () => {
  it('accepts resend', () => {
    expect(resolveEmailProvider({ EMAIL_PROVIDER: 'resend' })).toBe('resend');
  });
});

describe('ResendEmailSender + factory', () => {
  afterEach(() => {
    ConsoleEmailSender.clearForTests();
  });

  it('assertResendConfig requires key and from', () => {
    expect(() => assertResendConfig({})).toThrow(IncompleteResendConfigError);
  });

  it('sends via fetch and dual-captures under LOCAL_VALIDATION', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{}',
    });
    const sender = createEmailSender({
      env: {
        EMAIL_PROVIDER: 'resend',
        RESEND_API_KEY: 're_test',
        RESEND_FROM: 'Memoflow <n@mail.example.com>',
        LOCAL_VALIDATION: '1',
        SMTP_LOCALE: 'en',
      },
      resendFetch: fetchImpl,
    });
    expect(sender).toBeInstanceOf(ResendEmailSender);
    await sender.sendEmailVerificationCode('User@Ex.COM', '112233');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toContain('/emails');
    expect(init.headers.Authorization).toBe('Bearer re_test');
    const body = JSON.parse(init.body);
    expect(body.to).toEqual(['user@ex.com']);
    expect(body.subject.toLowerCase()).toMatch(/verification|password|memoflow/);
    expect(body.text).toContain('112233');
    expect(ConsoleEmailSender.getLatestCode('user@ex.com', 'email-verify')).toBe('112233');
  });
});

describe('FailoverEmailSender', () => {
  it('falls back to secondary when primary fails', async () => {
    const primary: IEmailSender = {
      sendPasswordResetCode: vi.fn().mockRejectedValue(new Error('primary down')),
      sendEmailVerificationCode: vi.fn().mockRejectedValue(new Error('primary down')),
    };
    const secondary: IEmailSender = {
      sendPasswordResetCode: vi.fn().mockResolvedValue(undefined),
      sendEmailVerificationCode: vi.fn().mockResolvedValue(undefined),
    };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const sender = new FailoverEmailSender(primary, secondary);
    await sender.sendEmailVerificationCode('a@b.co', '999000');
    expect(primary.sendEmailVerificationCode).toHaveBeenCalled();
    expect(secondary.sendEmailVerificationCode).toHaveBeenCalledWith('a@b.co', '999000');
    warn.mockRestore();
  });

  it('createEmailSender wraps secondary SMTP when configured', async () => {
    const primarySend = vi.fn().mockRejectedValue(new Error('smtp1'));
    const secondarySend = vi.fn().mockResolvedValue({});
    const primaryTransport: SmtpMailTransport = { sendMail: primarySend };
    const secondaryTransport: SmtpMailTransport = { sendMail: secondarySend };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const sender = createEmailSender({
      env: {
        EMAIL_PROVIDER: 'smtp',
        SMTP_HOST: 'primary.example.com',
        SMTP_USER: 'u1',
        SMTP_PASS: 'p1',
        SMTP_FROM: 'a@b.co',
        SMTP_SECONDARY_HOST: 'secondary.example.com',
        SMTP_SECONDARY_USER: 'u2',
        SMTP_SECONDARY_PASS: 'p2',
        SMTP_SECONDARY_FROM: 'a@b.co',
      },
      smtpTransport: primaryTransport,
      secondarySmtpTransport: secondaryTransport,
    });

    expect(sender).toBeInstanceOf(FailoverEmailSender);
    await sender.sendPasswordResetCode('x@y.z', '445566');
    expect(primarySend).toHaveBeenCalled();
    expect(secondarySend).toHaveBeenCalled();
    expect(secondarySend.mock.calls[0][0].text).toContain('445566');
    warn.mockRestore();
  });
});
