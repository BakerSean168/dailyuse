/**
 * Residual 961: sole toChallengePurpose helper for authentication email challenge use cases.
 * SendEmailVerificationCode + VerifyEmailCode import this; local duals retired.
 * Maps transport EmailVerificationPurpose onto domain VerificationChallengePurpose.
 */

import type { EmailVerificationPurpose } from '@dailyuse/contracts/authentication';
import {
  VerificationChallengePurpose,
  type VerificationChallengePurpose as ChallengePurpose,
} from '../domain';

/**
 * Map API email-verification purpose to domain challenge purpose.
 * Unknown / missing purposes default to EmailVerify.
 */
export function toChallengePurpose(
  purpose: EmailVerificationPurpose | undefined,
): ChallengePurpose {
  switch (purpose) {
    case 'EmailBind':
      return VerificationChallengePurpose.EmailBind;
    case 'EmailChange':
      return VerificationChallengePurpose.EmailChange;
    case 'EmailVerify':
    default:
      return VerificationChallengePurpose.EmailVerify;
  }
}
