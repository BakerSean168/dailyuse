/**
 * PrismaAuthIdentityRepository
 *
 * Prisma implementation of IAuthIdentityRepository.
 * Uses constructor-injected PrismaClient from @dailyuse/database.
 *
 * Maps between:
 * - Prisma models (AuthIdentity, AuthIdentifier, AuthOAuthBinding, AuthCredential) from the database
 * - Domain AuthIdentityPersistenceDTO / discriminated unions
 * 
 * Extends AggregateRepositoryBase to automatically publish domain events after persistence.
 */

import type { PrismaClient, Prisma } from '@dailyuse/database';
import type { IAuthIdentityRepository } from '../../domain-server';
import { AuthIdentity } from '../../domain-server';
import type {
  AuthIdentityPersistenceDTO,
  AuthCredentialServer,
  PasswordCredentialServer,
  AuthIdentifierPersistenceDTO,
  OAuthBindingPersistenceDTO,
} from '@dailyuse/contracts/authentication';
import { CredentialType } from '../../domain-shared';
import type { OAuthProvider } from '../../domain-shared';
import { createLogger } from '@dailyuse/utils';
import { AggregateRepositoryBase, type IEventBus } from '@dailyuse/patterns';

const logger = createLogger('PrismaAuthIdentityRepository');

/**
 * Prisma-based AuthIdentity Repository
 * 
 * 自动发送领域事件：
 * - 聚合根内的业务函数创建事件（通过 addDomainEvent）
 * - save() 方法先持久化，再自动发布所有领域事件
 * - 事件发布失败不会回滚事务，但会记录错误
 */
export class PrismaAuthIdentityRepository
  extends AggregateRepositoryBase<AuthIdentity>
  implements IAuthIdentityRepository
{
  constructor(
    private readonly prisma: PrismaClient,
    eventBus: IEventBus
  ) {
    super(eventBus);
  }

  /**
   * Protected persistence method - called by base class before event publishing
   */
  protected async persist(identity: AuthIdentity): Promise<void> {
    try {
      const dto = identity.toPersistenceDTO();

      await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 1. Upsert the identity record
        await tx.authIdentity.upsert({
          where: { id: dto.id },
          create: {
            id: dto.id,
            status: dto.status,
            failedLoginAttempts: dto.failedLoginAttempts,
            lastFailedAttempt: dto.lastFailedAttempt ?? null,
            lockedUntil: dto.lockedUntil ?? null,
            version: dto.version,
            createdAt: dto.createdAt,
            updatedAt: dto.updatedAt,
            deletedAt: dto.deletedAt ?? null,
          },
          update: {
            status: dto.status,
            failedLoginAttempts: dto.failedLoginAttempts,
            lastFailedAttempt: dto.lastFailedAttempt ?? null,
            lockedUntil: dto.lockedUntil ?? null,
            version: dto.version,
            updatedAt: dto.updatedAt,
            deletedAt: dto.deletedAt ?? null,
          },
        });

        // 2. Sync identifiers - delete old and re-create
        await tx.authIdentifier.deleteMany({ where: { identityId: dto.id } });
        for (const identifier of dto.identifiers) {
          await tx.authIdentifier.create({
            data: this.identifierToRow(identifier, dto.id),
          });
        }

        // 3. Sync OAuth bindings
        await tx.authOAuthBinding.deleteMany({ where: { identityId: dto.id } });
        for (const binding of dto.oauthBindings) {
          await tx.authOAuthBinding.create({
            data: this.oauthBindingToRow(binding, dto.id),
          });
        }

        // 4. Sync credentials
        await tx.authCredential.deleteMany({ where: { identityId: dto.id } });
        for (const cred of dto.credentials) {
          await tx.authCredential.create({
            data: this.credentialToRow(cred, dto.id),
          });
        }
      });

      logger.debug('[PrismaAuthIdentityRepository] Identity saved', { id: dto.id });
    } catch (error) {
      logger.error('[PrismaAuthIdentityRepository] Save failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

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
    return AuthIdentity.fromPersistenceDTO(this.mapRowToDTO(row));
  }

  /**
   * 根据邮箱查找身份（查标识符表）
   */
  async findByEmail(email: string): Promise<AuthIdentity | null> {
    const identifier = await this.prisma.authIdentifier.findFirst({
      where: {
        type: 'EMAIL',
        value: email,
      },
    });

    if (!identifier) return null;
    return this.findById(identifier.identityId);
  }

  /**
   * 根据手机号查找身份（查标识符表）
   */
  async findByPhone(phoneNumber: string): Promise<AuthIdentity | null> {
    const identifier = await this.prisma.authIdentifier.findFirst({
      where: {
        type: 'PHONE',
        value: phoneNumber,
      },
    });

    if (!identifier) return null;
    return this.findById(identifier.identityId);
  }

  /**
   * 根据 OAuth 信息查找身份（查绑定表）
   */
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

  /**
   * 检查邮箱是否已存在
   */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.authIdentifier.count({
      where: {
        type: 'EMAIL',
        value: email,
      },
    });
    return count > 0;
  }

  /**
   * 检查手机号是否已存在
   */
  async existsByPhone(phoneNumber: string): Promise<boolean> {
    const count = await this.prisma.authIdentifier.count({
      where: {
        type: 'PHONE',
        value: phoneNumber,
      },
    });
    return count > 0;
  }

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

  // ============ Private Mapping Helpers ============

  /**
   * Map Prisma row (with included relations) to AuthIdentityPersistenceDTO
   */
  private mapRowToDTO(row: any): AuthIdentityPersistenceDTO {
    return {
      id: row.id,
      status: row.status,
      failedLoginAttempts: row.failedLoginAttempts,
      lastFailedAttempt: row.lastFailedAttempt ?? null,
      lockedUntil: row.lockedUntil ?? null,
      identifiers: (row.identifiers ?? []).map((i: any) => this.mapIdentifierRow(i)),
      oauthBindings: (row.oauthBindings ?? []).map((b: any) => this.mapOAuthBindingRow(b)),
      credentials: (row.credentials ?? []).map((c: any) => this.mapCredentialRow(c)),
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt ?? null,
    };
  }

  /**
   * Map a Prisma AuthIdentifier row to AuthIdentifierPersistenceDTO
   */
  private mapIdentifierRow(i: any): AuthIdentifierPersistenceDTO {
    if (i.type === 'EMAIL') {
      return {
        type: 'EMAIL',
        value: i.value,
        isVerified: i.isVerified ?? false,
      };
    }
    if (i.type === 'PHONE') {
      return {
        type: 'PHONE',
        value: { value: i.value },
        isVerified: i.isVerified ?? false,
      };
    }
    throw new Error(`Unknown identifier type: ${i.type}`);
  }

  /**
   * Map a Prisma AuthOAuthBinding row to OAuthBindingPersistenceDTO
   */
  private mapOAuthBindingRow(b: any): OAuthBindingPersistenceDTO {
    return {
      id: b.id,
      provider: b.provider,
      providerSubjectId: b.providerSubjectId,
      accessToken: b.accessToken ?? null,
      refreshToken: b.refreshToken ?? null,
      expiresAt: b.expiresAt ?? null,
      createdAt: b.createdAt,
      lastUsedAt: b.lastUsedAt ?? null,
    };
  }

  /**
   * Map a Prisma AuthCredential row to PasswordCredentialServer
   */
  private mapCredentialRow(c: any): AuthCredentialServer {
    const base = {
      id: c.id,
      status: c.status,
      createdAt: c.createdAt,
      lastUsedAt: c.lastUsedAt ?? null,
    };

    if (c.type === CredentialType.PASSWORD || c.type === 'PASSWORD') {
      return {
        ...base,
        type: CredentialType.PASSWORD,
        hashedPassword: c.passwordHash,
        passwordLastChangedAt: c.passwordLastChangedAt ?? c.createdAt,
      } as PasswordCredentialServer;
    }

    throw new Error(`Unknown credential type: ${c.type}`);
  }

  /**
   * Convert identifier to flat row
   */
  private identifierToRow(identifier: AuthIdentifierPersistenceDTO, identityId: string): Prisma.AuthIdentifierUncheckedCreateInput {
    return {
      identityId,
      type: identifier.type,
      value: identifier.type === 'PHONE'
        ? (identifier.value as { value: string }).value
        : identifier.value as string,
      isVerified: identifier.isVerified,
    };
  }

  /**
   * Convert OAuth binding to flat row
   */
  private oauthBindingToRow(binding: OAuthBindingPersistenceDTO, identityId: string): Prisma.AuthOAuthBindingUncheckedCreateInput {
    return {
      id: binding.id,
      identityId,
      provider: binding.provider as string,
      providerSubjectId: binding.providerSubjectId,
      accessToken: binding.accessToken,
      refreshToken: binding.refreshToken,
      expiresAt: binding.expiresAt,
      createdAt: binding.createdAt,
      lastUsedAt: binding.lastUsedAt,
    };
  }

  /**
   * Convert a domain credential to a flat Prisma row object
   */
  private credentialToRow(cred: AuthCredentialServer, identityId: string): Prisma.AuthCredentialUncheckedCreateInput {
    const row: Prisma.AuthCredentialUncheckedCreateInput = {
      id: cred.id,
      identityId,
      type: cred.type,
      status: cred.status,
      createdAt: cred.createdAt,
      lastUsedAt: cred.lastUsedAt ?? null,
    };

    if (cred.type === CredentialType.PASSWORD || cred.type === 'PASSWORD') {
      const p = cred as PasswordCredentialServer;
      row.passwordHash = p.hashedPassword;
      row.passwordLastChangedAt = p.passwordLastChangedAt;
    }

    return row;
  }
}
