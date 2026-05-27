/**
 * PrismaAuthIdentityRepository
 *
 * Prisma implementation of IAuthIdentityRepository.
 * Mapping logic is delegated to PrismaAuthIdentityMapper.
 *
 * Extends AggregateRepositoryBase to automatically publish domain events after persistence.
 */

import type { PrismaClient, Prisma } from '@dailyuse/database';
import type { IAuthIdentityRepository } from '../../../domain-server';
import { AuthIdentity } from '../../../domain-server';
import type { OAuthProvider } from '../../../domain-shared';
import { createLogger } from '@dailyuse/utils/logger';
import { AggregateRepositoryBase, type IEventBus } from '@dailyuse/patterns';
import { PrismaAuthIdentityMapper } from './mappers';
import type { PrismaAuthIdentityWithRelations } from '../../types';

const logger = createLogger('PrismaAuthIdentityRepository');

/**
 * AuthIdentity Prisma Repository
 */
export class PrismaAuthIdentityRepository
  extends AggregateRepositoryBase<AuthIdentity>
  implements IAuthIdentityRepository
{
  constructor(
    private readonly prisma: PrismaClient,
    eventBus: IEventBus,
  ) {
    super(eventBus);
  }

  // ================= Write Operations =================

  protected async persist(identity: AuthIdentity): Promise<void> {
    try {
      const data = PrismaAuthIdentityMapper.toPersistence(identity);

      await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 1. Upsert the identity root
        await tx.authIdentity.upsert({
          where: { id: data.identity.id },
          create: data.identity,
          update: {
            status: data.identity.status,
            failedLoginAttempts: data.identity.failedLoginAttempts,
            lastFailedAttempt: data.identity.lastFailedAttempt,
            lockedUntil: data.identity.lockedUntil,
            version: data.identity.version,
            updatedAt: data.identity.updatedAt,
            deletedAt: data.identity.deletedAt,
          },
        });

        // 2. Sync identifiers - delete old and re-create
        await tx.authIdentifier.deleteMany({ where: { identityId: data.identity.id } });
        for (const identifier of data.identifiers) {
          await tx.authIdentifier.create({ data: identifier });
        }

        // 3. Sync OAuth bindings
        await tx.authOAuthBinding.deleteMany({ where: { identityId: data.identity.id } });
        for (const binding of data.oauthBindings) {
          await tx.authOAuthBinding.create({ data: binding });
        }

        // 4. Sync credentials
        await tx.authCredential.deleteMany({ where: { identityId: data.identity.id } });
        for (const cred of data.credentials) {
          await tx.authCredential.create({ data: cred });
        }
      });

      logger.debug('[PrismaAuthIdentityRepository] Identity saved', { id: data.identity.id });
    } catch (error) {
      logger.error('[PrismaAuthIdentityRepository] Save failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // ================= Read Operations =================

  async findById(id: string): Promise<AuthIdentity | null> {
    const row = await this.prisma.authIdentity.findUnique({
      where: { id },
      include: {
        identifiers: true,
        oauthBindings: true,
        credentials: true,
      },
    });

    if (!row) return null;
    return PrismaAuthIdentityMapper.toDomain(row as PrismaAuthIdentityWithRelations);
  }

  async findByEmail(email: string): Promise<AuthIdentity | null> {
    const identifier = await this.prisma.authIdentifier.findFirst({
      where: { type: 'Email', value: email },
    });
    if (!identifier) return null;
    return this.findById(identifier.identityId);
  }

  async findByPhone(phoneNumber: string): Promise<AuthIdentity | null> {
    const identifier = await this.prisma.authIdentifier.findFirst({
      where: { type: 'Phone', value: phoneNumber },
    });
    if (!identifier) return null;
    return this.findById(identifier.identityId);
  }

  async findByOAuth(provider: OAuthProvider, subjectId: string): Promise<AuthIdentity | null> {
    const binding = await this.prisma.authOAuthBinding.findFirst({
      where: {
        provider: provider as string,
        providerSubjectId: subjectId,
      },
    });
    if (!binding) return null;
    return this.findById(binding.identityId);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.authIdentifier.count({
      where: { type: 'Email', value: email },
    });
    return count > 0;
  }

  async existsByPhone(phoneNumber: string): Promise<boolean> {
    const count = await this.prisma.authIdentifier.count({
      where: { type: 'Phone', value: phoneNumber },
    });
    return count > 0;
  }

  // ================= Delete Operations =================

  async delete(identity: AuthIdentity): Promise<void> {
    const id = identity.id;
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.authIdentifier.deleteMany({ where: { identityId: id } });
      await tx.authOAuthBinding.deleteMany({ where: { identityId: id } });
      await tx.authCredential.deleteMany({ where: { identityId: id } });
      await tx.authSession.deleteMany({ where: { identityId: id } });
      await tx.authIdentity.delete({ where: { id } });
    });
  }
}
