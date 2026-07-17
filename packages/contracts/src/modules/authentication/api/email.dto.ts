/**
 * Authentication - Email verification operations
 *
 * Send / verify email ownership codes (register verify, bind, change).
 */

import { z } from 'zod';
import type { AuthIdentityClientDTO } from '../aggregates/auth-identity-client';

export const EmailVerificationPurposeSchema = z.enum([
  'EmailVerify',
  'EmailBind',
  'EmailChange',
]);

export type EmailVerificationPurpose = z.infer<typeof EmailVerificationPurposeSchema>;

/**
 * Send email verification code.
 * email is optional when authenticated (server uses primary login email).
 */
export const SendEmailCodeSchema = z.object({
  email: z.string().email().optional(),
  purpose: EmailVerificationPurposeSchema.default('EmailVerify'),
});

export type SendEmailCodeReq = z.infer<typeof SendEmailCodeSchema>;
export type SendEmailCodeRes = void;

/**
 * Verify email ownership with a one-time code.
 */
export const VerifyEmailCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, '验证码错误'),
  purpose: EmailVerificationPurposeSchema.default('EmailVerify'),
});

export type VerifyEmailCodeReq = z.infer<typeof VerifyEmailCodeSchema>;

/** Optional refreshed identity when the caller is authenticated. */
export type VerifyEmailCodeRes = {
  identity?: AuthIdentityClientDTO;
};
