/**
 * Transactional email subject/body templates (server-side, no app-vue i18n).
 *
 * Locale is chosen via SMTP_LOCALE / EMAIL_LOCALE (zh | en), default zh with
 * bilingual fallback lines where useful. Codes only appear in the body.
 */

export type EmailTemplateLocale = 'zh' | 'en';
export type EmailTemplateKind = 'email-verify' | 'password-reset';

export const CODE_TTL_MINUTES = 10;

export type BuiltEmailContent = {
  readonly subject: string;
  readonly text: string;
  readonly html: string;
};

export function resolveEmailTemplateLocale(raw?: string | null): EmailTemplateLocale {
  const v = (raw ?? '').trim().toLowerCase();
  if (v === 'en' || v === 'en-us' || v === 'en_us') return 'en';
  if (v === 'zh' || v === 'zh-cn' || v === 'zh_cn' || v === 'zh-hans') return 'zh';
  // Default Chinese product copy; en opt-in
  return 'zh';
}

const COPY = {
  zh: {
    verifySubject: '【Memoflow】邮箱验证码',
    resetSubject: '【Memoflow】密码重置验证码',
    verifyPurpose: '完成邮箱验证',
    resetPurpose: '重置密码',
    codeLabel: '您的验证码是',
    purposeLabel: '用途',
    ttlLabel: '有效期',
    minutes: '分钟',
    ignore: '如非本人操作请忽略此邮件。',
  },
  en: {
    verifySubject: '[Memoflow] Email verification code',
    resetSubject: '[Memoflow] Password reset code',
    verifyPurpose: 'complete email verification',
    resetPurpose: 'reset your password',
    codeLabel: 'Your code is',
    purposeLabel: 'Purpose',
    ttlLabel: 'Valid for',
    minutes: 'minutes',
    ignore: 'If you did not request this, ignore this message.',
  },
} as const;

export function buildTransactionalEmail(
  kind: EmailTemplateKind,
  code: string,
  localeInput?: string | null,
): BuiltEmailContent {
  const locale = resolveEmailTemplateLocale(localeInput);
  const c = COPY[locale];
  const purpose = kind === 'email-verify' ? c.verifyPurpose : c.resetPurpose;
  const subject = kind === 'email-verify' ? c.verifySubject : c.resetSubject;

  const text = [
    `${c.codeLabel}: ${code}`,
    '',
    `${c.purposeLabel}: ${purpose}`,
    `${c.ttlLabel}: ${CODE_TTL_MINUTES} ${c.minutes}`,
    '',
    c.ignore,
  ].join('\n');

  const html = [
    `<p>${c.codeLabel}:</p>`,
    `<p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p>`,
    `<p>${c.purposeLabel}: ${purpose}</p>`,
    `<p>${c.ttlLabel}: ${CODE_TTL_MINUTES} ${c.minutes}</p>`,
    `<p>${c.ignore}</p>`,
  ].join('');

  return { subject, text, html };
}
