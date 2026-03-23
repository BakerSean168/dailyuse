import type { IAuthIdentityRepository, IAuthSessionRepository } from '@/domain-server';
import type { IPasswordResetCodeStore } from '@/domain-server/services/i-password-reset-code-store';
import { CredentialType, HashedPassword, PlainPassword } from '@/domain-shared';
import type { IPasswordHasher } from '@/domain-shared';
import type { ResetPasswordReq } from '@dailyuse/contracts/authentication';

// Business exceptions
export class InvalidResetCodeError extends Error {
  constructor() {
    super('Invalid or expired reset code.');
    this.name = 'InvalidResetCodeError';
  }
}

export class UserNotFoundError extends Error {
  constructor(email: string) {
    super(`User with email [${email}] not found.`);
    this.name = 'UserNotFoundError';
  }
}

export class ResetPassword {
  constructor(
    private readonly identityRepository: IAuthIdentityRepository,
    private readonly sessionRepository: IAuthSessionRepository,
    private readonly codeStore: IPasswordResetCodeStore,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: ResetPasswordReq): Promise<void> {
    // 1. Verify the reset code
    const valid = await this.codeStore.verifyCode(input.email, input.code);
    if (!valid) {
      throw new InvalidResetCodeError();
    }

    // 2. Look up identity by email
    const identity = await this.identityRepository.findByEmail(input.email);
    if (!identity) {
      throw new UserNotFoundError(input.email);
    }

    // 3. Get the password credential and update it
    const credential = identity.getCredentialByType(CredentialType.Password);
    if (!credential) {
      throw new Error('Password credential not found');
    }

    const nextPassword = PlainPassword.create({ value: input.newPassword });
    const hashedPassword = await HashedPassword.create(nextPassword, this.passwordHasher);
    credential.updatePassword(hashedPassword);
    await this.identityRepository.save(identity);

    // 4. Revoke all existing sessions for security
    await this.sessionRepository.removeAllByIdentityId(identity.id);
  }
}
