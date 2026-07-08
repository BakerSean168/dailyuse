import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { IAuthIdentityRepository, IAuthSessionRepository } from '../../../domain';
import {
  CredentialType,
  HashedPassword,
  PlainPassword,
  type IPasswordHasher,
} from '../../../domain';
import type { ChangePasswordReq } from '@dailyuse/contracts/authentication';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import { IdentityId } from '@dailyuse/domain-shared/shared';

export class ChangePasswordUseCase {
  constructor(
    private readonly identityRepository: IAuthIdentityRepository,
    private readonly sessionRepository: IAuthSessionRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: ChangePasswordReq, cx: ExecutionContext): Promise<Result<void>> {
    const identity = await this.identityRepository.findById(IdentityId.of(cx.identityId));
    if (!identity) {
      return error('NOT_FOUND', 'Identity not found');
    }

    const passwordValid = await identity.verifyPassword(input.oldPassword, this.passwordHasher);
    if (!passwordValid) {
      return error('UNAUTHORIZED', 'Invalid current password');
    }

    const credential = identity.getCredentialByType(CredentialType.Password);
    if (!credential) {
      return error('NOT_FOUND', 'Password credential not found');
    }

    const nextPassword = PlainPassword.create({ value: input.newPassword });
    const hashedPassword = await HashedPassword.create(nextPassword, this.passwordHasher);
    credential.updatePassword(hashedPassword);
    await this.identityRepository.save(identity);

    const sessions = await this.sessionRepository.findByIdentityId(IdentityId.of(cx.identityId));
    for (const session of sessions) {
      if (session.isValid()) {
        session.revoke();
        await this.sessionRepository.save(session);
      }
    }

    return ok(undefined);
  }
}
