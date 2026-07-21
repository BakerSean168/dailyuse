/**
 * Reset Password Use Case
 *
 * Consumes a PasswordReset challenge, updates the password credential,
 * and revokes all sessions for the identity.
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, error, fail } from '@dailyuse/contracts/result';
import type {
  IAuthIdentityRepository,
  IAuthSessionRepository,
  IVerificationChallengeStore,
} from '../../../domain';
import {
  AuthDomainCode,
  CredentialType,
  HashedPassword,
  PlainPassword,
  VerificationChallengePurpose,
  type IPasswordHasher,
} from '../../../domain';
import type { ResetPasswordReq } from '@dailyuse/contracts/authentication';

export class ResetPasswordUseCase {
  constructor(
    private readonly identityRepository: IAuthIdentityRepository,
    private readonly sessionRepository: IAuthSessionRepository,
    private readonly challengeStore: IVerificationChallengeStore,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: ResetPasswordReq): Promise<Result<void>> {
    const valid = await this.challengeStore.consume({
      purpose: VerificationChallengePurpose.PasswordReset,
      subject: input.email,
      challenge: input.code,
    });

    if (!valid) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid or expired reset code.',
        context: { domainCode: AuthDomainCode.INVALID_OR_EXPIRED_CODE },
      });
    }

    const identity = await this.identityRepository.findByEmail(input.email);
    if (!identity) {
      return error('NOT_FOUND', `User with email [${input.email}] not found.`);
    }

    const credential = identity.getCredentialByType(CredentialType.Password);
    if (!credential) {
      return error('NOT_FOUND', 'Password credential not found');
    }

    const nextPassword = PlainPassword.create({ value: input.newPassword });
    const hashedPassword = await HashedPassword.create(nextPassword, this.passwordHasher);
    credential.updatePassword(hashedPassword);
    await this.identityRepository.save(identity);

    await this.sessionRepository.removeAllByIdentityId(identity.id);

    return ok(undefined);
  }
}
