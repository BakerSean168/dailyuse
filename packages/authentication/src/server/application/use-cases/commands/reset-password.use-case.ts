import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type {
  IAuthIdentityRepository,
  IAuthSessionRepository,
  IPasswordResetCodeStore,
} from '../../../domain';
import {
  CredentialType,
  HashedPassword,
  PlainPassword,
  type IPasswordHasher,
} from '../../../domain';
import type { ResetPasswordReq } from '@dailyuse/contracts/authentication';

// Business exceptions — kept for backward compatibility with tests
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

export class ResetPasswordUseCase {
  constructor(
    private readonly identityRepository: IAuthIdentityRepository,
    private readonly sessionRepository: IAuthSessionRepository,
    private readonly codeStore: IPasswordResetCodeStore,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: ResetPasswordReq): Promise<Result<void>> {
    // 1. Verify the reset code
    const valid = await this.codeStore.verifyCode(input.email, input.code);
    if (!valid) {
      return error('VALIDATION_ERROR', 'Invalid or expired reset code.');
    }

    // 2. Look up identity by email
    const identity = await this.identityRepository.findByEmail(input.email);
    if (!identity) {
      return error('NOT_FOUND', `User with email [${input.email}] not found.`);
    }

    // 3. Get the password credential and update it
    const credential = identity.getCredentialByType(CredentialType.Password);
    if (!credential) {
      return error('NOT_FOUND', 'Password credential not found');
    }

    const nextPassword = PlainPassword.create({ value: input.newPassword });
    const hashedPassword = await HashedPassword.create(nextPassword, this.passwordHasher);
    credential.updatePassword(hashedPassword);
    await this.identityRepository.save(identity);

    // 4. Revoke all existing sessions for security
    await this.sessionRepository.removeAllByIdentityId(identity.id);

    return ok(undefined);
  }
}
