/**
 * Forgot Password Use Case
 *
 * Issues a PasswordReset challenge and emails the plaintext code.
 * Always returns success when the email is unknown (anti-enumeration).
 */

import type { Result } from '@memoflow/contracts/result';
import { ok, fail } from '@memoflow/contracts/result';
import type { IAuthIdentityRepository, IEmailSender, IVerificationChallengeStore } from '../../../domain';
import {
  AuthDomainCode,
  ChallengeCooldownError,
  ChallengeRateLimitError,
  VerificationChallengePurpose,
} from '../../../domain';
import type { ForgotPasswordReq } from '@memoflow/contracts/authentication';

export class ForgotPasswordUseCase {
  constructor(
    private readonly identityRepository: IAuthIdentityRepository,
    private readonly challengeStore: IVerificationChallengeStore,
    private readonly emailSender: IEmailSender,
  ) {}

  async execute(input: ForgotPasswordReq): Promise<Result<void>> {
    const identity = await this.identityRepository.findByEmail(input.email);

    if (!identity) {
      // Security: don't reveal whether the email exists in the system.
      return ok(undefined);
    }

    try {
      const code = await this.challengeStore.issue({
        purpose: VerificationChallengePurpose.PasswordReset,
        subject: input.email,
        identityId: String(identity.id),
      });
      await this.emailSender.sendPasswordResetCode(input.email, code);
      return ok(undefined);
    } catch (err) {
      if (err instanceof ChallengeCooldownError) {
        return fail({
          code: 'RATE_LIMITED',
          message: 'Please wait before requesting another reset code.',
          context: {
            domainCode: AuthDomainCode.CHALLENGE_COOLDOWN,
            retryAfterMs: err.retryAfterMs,
          },
        });
      }
      if (err instanceof ChallengeRateLimitError) {
        return fail({
          code: 'RATE_LIMITED',
          message: 'Too many reset code requests for this email today.',
          context: {
            domainCode: AuthDomainCode.CHALLENGE_RATE_LIMITED,
          },
        });
      }
      throw err;
    }
  }
}
