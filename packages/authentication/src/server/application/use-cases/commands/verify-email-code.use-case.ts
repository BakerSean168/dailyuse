/**
 * Verify Email Code Use Case
 *
 * Consumes an EmailVerify challenge, marks the email identifier verified,
 * activates the identity when still Unverified, and publishes auth:email-verified.
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, fail } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type {
  VerifyEmailCodeReq,
  VerifyEmailCodeRes,
} from '@dailyuse/contracts/authentication';
import type { IAuthIdentityRepository, IVerificationChallengeStore } from '../../../domain';
// Residual 959: normalizeEmail dual retired — sole server shared normalize-email helper.
import { normalizeEmail } from '../../../shared/normalize-email';
import {
  AuthDomainCode,
  AuthIdentityStatus,
  VerificationChallengePurpose,
} from '../../../domain';


function toChallengePurpose(
  purpose: VerifyEmailCodeReq['purpose'],
): (typeof VerificationChallengePurpose)[keyof typeof VerificationChallengePurpose] {
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

export class VerifyEmailCodeUseCase {
  constructor(
    private readonly identityRepository: IAuthIdentityRepository,
    private readonly challengeStore: IVerificationChallengeStore,
  ) {}

  async execute(
    input: VerifyEmailCodeReq,
    _cx?: ExecutionContext,
  ): Promise<Result<VerifyEmailCodeRes>> {
    const purpose = input.purpose ?? 'EmailVerify';
    const email = normalizeEmail(input.email);
    const challengePurpose = toChallengePurpose(purpose);

    // Phase B2 focuses on EmailVerify. Bind/Change keep the same challenge surface
    // but require additional product rules (not fully implemented here).
    if (purpose !== 'EmailVerify') {
      return fail({
        code: 'SERVICE_UNAVAILABLE',
        message: `Email purpose ${purpose} is not fully implemented yet`,
      });
    }

    const valid = await this.challengeStore.consume({
      purpose: challengePurpose,
      subject: email,
      challenge: input.code,
    });

    if (!valid) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid or expired verification code.',
        context: { domainCode: AuthDomainCode.INVALID_OR_EXPIRED_CODE },
      });
    }

    const identity = await this.identityRepository.findByEmail(email);
    if (!identity) {
      // Code was valid but identity gone — treat as invalid to avoid leaking.
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid or expired verification code.',
        context: { domainCode: AuthDomainCode.INVALID_OR_EXPIRED_CODE },
      });
    }

    const bound = identity.findIdentifierByEmail(email);
    if (!bound) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid or expired verification code.',
        context: { domainCode: AuthDomainCode.INVALID_OR_EXPIRED_CODE },
      });
    }

    if (!bound.isVerified) {
      identity.verifyEmailIdentifier(email);
    }

    if (AuthIdentityStatus.isUnverified(identity.status)) {
      identity.activate();
    }

    await this.identityRepository.save(identity);

    return ok({
      identity: identity.toClientDTO(),
    });
  }
}
