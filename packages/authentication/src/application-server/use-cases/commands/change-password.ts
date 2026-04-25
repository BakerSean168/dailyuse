import type { IAuthIdentityRepository, IAuthSessionRepository } from '../../../domain-server';
import {
  CredentialType,
  HashedPassword,
  PlainPassword,
  type IPasswordHasher,
} from '../../../domain-shared';
import type { ChangePasswordReq, ChangePasswordRes } from '@dailyuse/contracts/authentication';
import type { Context } from '@dailyuse/contracts/shared';
import { IdentityId } from '@dailyuse/domain-shared/shared';

export class ChangePassword {
  constructor(
    private readonly identityRepository: IAuthIdentityRepository,
    private readonly sessionRepository: IAuthSessionRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: ChangePasswordReq, cx: Context): Promise<ChangePasswordRes> {
    const identity = await this.identityRepository.findById(IdentityId.of(cx.identityId));
    if (!identity) {
      throw new Error('Identity not found');
    }

    const passwordValid = await identity.verifyPassword(input.oldPassword, this.passwordHasher);
    if (!passwordValid) {
      throw new Error('Invalid current password');
    }

    const credential = identity.getCredentialByType(CredentialType.Password);
    if (!credential) {
      throw new Error('Password credential not found');
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
  }
}
