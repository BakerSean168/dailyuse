/**
 * Send Email Verification Code Use Case
 *
 * Issues an EmailVerify (or bind/change) challenge and emails the plaintext code.
 * Anti-enumeration: unknown emails still return success for EmailVerify.
 */

import type { Result } from '@memoflow/contracts/result';
import { ok, fail } from '@memoflow/contracts/result';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import type { SendEmailCodeReq } from '@memoflow/contracts/authentication';
import type {
  IAuthIdentityRepository,
  IEmailSender,
  IVerificationChallengeStore,
} from '../../../domain';
import {
  AuthDomainCode,
  ChallengeCooldownError,
  ChallengeRateLimitError,
} from '../../../domain';
import { IdentityId } from '@memoflow/domain-shared/shared';
// Residual 959: normalizeEmail dual retired — sole server shared normalize-email helper.
import { normalizeEmail } from '../../../shared/normalize-email';
// Residual 961: toChallengePurpose dual retired — sole server shared to-challenge-purpose helper.
import { toChallengePurpose } from '../../../shared/to-challenge-purpose';



export class SendEmailVerificationCodeUseCase {
  constructor(
    private readonly identityRepository: IAuthIdentityRepository,
    private readonly challengeStore: IVerificationChallengeStore,
    private readonly emailSender: IEmailSender,
  ) {}

  async execute(input: SendEmailCodeReq, cx?: ExecutionContext): Promise<Result<void>> {
    const purpose = input.purpose ?? 'EmailVerify';
    const challengePurpose = toChallengePurpose(purpose);

    // Resolve target email + identity
    let email = input.email ? normalizeEmail(input.email) : undefined;
    let identityId: string | undefined;

    if (cx?.identityId) {
      const identity = await this.identityRepository.findById(IdentityId.of(cx.identityId));
      if (!identity) {
        // Authenticated but identity missing — still anti-enumerate for verify.
        if (purpose === 'EmailVerify') {
          return ok(undefined);
        }
        return fail({
          code: 'NOT_FOUND',
          message: 'Identity not found',
        });
      }

      if (!email) {
        const primary = identity.identifiers.find((i) => i.type === 'Email');
        if (!primary || primary.type !== 'Email') {
          return fail({
            code: 'VALIDATION_ERROR',
            message: 'No email bound to this identity',
          });
        }
        email = normalizeEmail(primary.value);
      }

      const bound = identity.findIdentifierByEmail(email);
      if (purpose === 'EmailVerify') {
        if (!bound) {
          // Anti-enumeration: do not reveal that email is not on this account.
          return ok(undefined);
        }
        if (bound.isVerified) {
          return ok(undefined);
        }
        identityId = String(identity.id);
      } else if (purpose === 'EmailBind') {
        if (bound) {
          return fail({
            code: 'CONFLICT',
            message: 'Email already bound to this identity',
          });
        }
        identityId = String(identity.id);
      } else {
        // EmailChange: email must not already be verified primary without change flow.
        identityId = String(identity.id);
      }
    } else {
      // Unauthenticated: only EmailVerify is allowed; email required.
      if (purpose !== 'EmailVerify') {
        return fail({
          code: 'UNAUTHORIZED',
          message: 'Authentication required for this email purpose',
        });
      }
      if (!email) {
        return fail({
          code: 'VALIDATION_ERROR',
          message: 'Email is required',
        });
      }
      const identity = await this.identityRepository.findByEmail(email);
      if (!identity) {
        return ok(undefined);
      }
      const bound = identity.findIdentifierByEmail(email);
      if (!bound || bound.isVerified) {
        return ok(undefined);
      }
      identityId = String(identity.id);
    }

    if (!email) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Email is required',
      });
    }

    try {
      const code = await this.challengeStore.issue({
        purpose: challengePurpose,
        subject: email,
        identityId,
      });
      await this.emailSender.sendEmailVerificationCode(email, code);
      return ok(undefined);
    } catch (err) {
      if (err instanceof ChallengeCooldownError) {
        return fail({
          code: 'RATE_LIMITED',
          message: 'Please wait before requesting another verification code.',
          context: {
            domainCode: AuthDomainCode.CHALLENGE_COOLDOWN,
            retryAfterMs: err.retryAfterMs,
          },
        });
      }
      if (err instanceof ChallengeRateLimitError) {
        return fail({
          code: 'RATE_LIMITED',
          message: 'Too many verification code requests for this email today.',
          context: {
            domainCode: AuthDomainCode.CHALLENGE_RATE_LIMITED,
          },
        });
      }
      throw err;
    }
  }
}
