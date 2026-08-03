import type { PrismaClient } from '@memoflow/database';
import { IdentityId } from '@memoflow/domain-shared/shared';
import { Account, type IAccountRepository } from '../domain';
import { createAccountPrismaRepository } from './prisma';

export interface CloudAccountProvisioningInput {
  readonly identityId: string;
  readonly email: string;
  readonly name: string;
  readonly emailVerified: boolean;
}

export function createCloudAccountProvisionerFromRepository(repository: IAccountRepository): {
  provision(input: CloudAccountProvisioningInput): Promise<void>;
} {
  return {
    async provision(input) {
      const existing = await repository.findById(input.identityId);
      if (existing) {
        if (
          input.emailVerified &&
          (existing.email.address !== input.email || !existing.email.isVerified)
        ) {
          existing.syncVerifiedEmail(input.email);
          await repository.save(existing);
        }
        return;
      }

      const account = Account.create({
        id: IdentityId.of(input.identityId),
        email: input.email,
      });
      const cloudDisplayName = input.name.trim().slice(0, 20);
      if (cloudDisplayName.length >= 2) {
        account.updateProfile(account.profile.updateNickname(cloudDisplayName));
      }
      if (input.emailVerified) account.syncVerifiedEmail(input.email);
      await repository.save(account);
    },
  };
}

export function createCloudAccountProvisioner(db: PrismaClient): {
  provision(input: CloudAccountProvisioningInput): Promise<void>;
} {
  return createCloudAccountProvisionerFromRepository(createAccountPrismaRepository(db));
}
