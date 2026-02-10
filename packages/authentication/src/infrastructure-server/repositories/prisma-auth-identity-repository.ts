/**
 * PrismaAuthIdentityRepository
 *
 * Prisma implementation of IAuthIdentityRepository.
 * Uses constructor-injected PrismaClient from @dailyuse/database.
 *
 * Maps between:
 * - Prisma models (AuthIdentity, AuthCredential) from the database
 * - Domain AuthIdentityPersistenceDTO / AuthCredentialServer discriminated unions
 */

import type { PrismaClient } from '@dailyuse/database';
import type { IAuthIdentityRepository } from '../../domain-server';
import { AuthIdentity } from '../../domain-server';
import type {
  AuthIdentityPersistenceDTO,
  AuthCredentialServer,
  PasswordCredentialServer,
  OAuthCredentialServer,
  PhoneCredentialServer,
} from '@dailyuse/contracts/authentication';
import { CredentialType } from '../../domain-shared';
import type { OAuthProvider } from '../../domain-shared';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('PrismaAuthIdentityRepository');

/**
 * Prisma-based AuthIdentity Repository
 */
export class PrismaAuthIdentityRepository implements IAuthIdentityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(identity: AuthIdentity): Promise<void> {
    try {
      const dto = identity.toPersistenceDTO();

      await this.prisma.$transaction(async (tx: any) => {
        // Upsert the identity record
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

        // Upsert each credential
        for (const cred of dto.credentials) {
          const commonData = this.credentialToRow(cred, dto.id);
          await tx.authCredential.upsert({
            where: { id: cred.id },
            create: commonData,
            update: commonData,
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
      include: { credentials: true },
    });

    if (!row) return null;
    return AuthIdentity.fromPersistenceDTO(this.mapRowToDTO(row));
  }

  async findByEmail(email: string): Promise<AuthIdentity | null> {
    const credential = await this.prisma.authCredential.findFirst({
      where: {
        identifier: email,
        type: CredentialType.PASSWORD,
      },
    });

    if (!credential) return null;
    return this.findById(credential.identityId);
  }

  async findByPhone(phoneNumber: string): Promise<AuthIdentity | null> {
    const credential = await this.prisma.authCredential.findFirst({
      where: {
        identifier: phoneNumber,
        type: CredentialType.PHONE,
      },
    });

    if (!credential) return null;
    return this.findById(credential.identityId);
  }

  async findByOAuth(provider: OAuthProvider, subjectId: string): Promise<AuthIdentity | null> {
    const credential = await this.prisma.authCredential.findFirst({
      where: {
        provider,
        providerSubjectId: subjectId,
        type: CredentialType.OAUTH,
      },
    });

    if (!credential) return null;
    return this.findById(credential.identityId);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.authCredential.count({
      where: {
        identifier: email,
        type: CredentialType.PASSWORD,
      },
    });
    return count > 0;
  }

  async existsByPhone(phoneNumber: string): Promise<boolean> {
    const count = await this.prisma.authCredential.count({
      where: {
        identifier: phoneNumber,
        type: CredentialType.PHONE,
      },
    });
    return count > 0;
  }

  async delete(identity: AuthIdentity): Promise<void> {
    const id = identity.id;
    await this.prisma.$transaction(async (tx: any) => {
      await tx.authCredential.deleteMany({ where: { identityId: id } });
      await tx.authSession.deleteMany({ where: { identityId: id } });
      await tx.authIdentity.delete({ where: { id } });
    });
  }

  // ============ Private Mapping Helpers ============

  /**
   * Map Prisma row (with included credentials) to AuthIdentityPersistenceDTO
   */
  private mapRowToDTO(row: any): AuthIdentityPersistenceDTO {
    return {
      id: row.id,
      status: row.status,
      failedLoginAttempts: row.failedLoginAttempts,
      lastFailedAttempt: row.lastFailedAttempt ?? null,
      lockedUntil: row.lockedUntil ?? null,
      credentials: (row.credentials ?? []).map((c: any) => this.mapCredentialRow(c)),
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt ?? null,
    };
  }

  /**
   * Map a Prisma AuthCredential row to the discriminated union AuthCredentialServer
   */
  private mapCredentialRow(c: any): AuthCredentialServer {
    const base = {
      id: c.id,
      status: c.status,
      createdAt: c.createdAt,
      lastUsedAt: c.lastUsedAt ?? null,
    };

    switch (c.type) {
      case CredentialType.PASSWORD:
        return {
          ...base,
          type: CredentialType.PASSWORD,
          hashedPassword: c.passwordHash,
          passwordLastChangedAt: c.passwordLastChangedAt ?? c.createdAt,
        } as PasswordCredentialServer;

      case CredentialType.OAUTH:
        return {
          ...base,
          type: CredentialType.OAUTH,
          provider: c.provider,
          providerSubjectId: c.providerSubjectId,
          accessToken: c.accessToken ?? null,
          refreshToken: c.refreshToken ?? null,
          expiresAt: c.oauthExpiresAt ?? null,
        } as OAuthCredentialServer;

      case CredentialType.PHONE:
        return {
          ...base,
          type: CredentialType.PHONE,
          phoneNumber: c.identifier,
          isVerified: c.isVerified ?? false,
        } as PhoneCredentialServer;

      default:
        throw new Error(`Unknown credential type: ${c.type}`);
    }
  }

  /**
   * Convert a domain credential to a flat Prisma row object
   */
  private credentialToRow(cred: AuthCredentialServer, identityId: string): Record<string, any> {
    const row: Record<string, any> = {
      id: cred.id,
      identityId,
      type: cred.type,
      status: cred.status,
      createdAt: cred.createdAt,
      lastUsedAt: cred.lastUsedAt ?? null,
    };

    switch (cred.type) {
      case CredentialType.PASSWORD: {
        const p = cred as PasswordCredentialServer;
        row.passwordHash = p.hashedPassword;
        row.passwordLastChangedAt = p.passwordLastChangedAt;
        break;
      }
      case CredentialType.OAUTH: {
        const o = cred as OAuthCredentialServer;
        row.provider = o.provider;
        row.providerSubjectId = o.providerSubjectId;
        row.accessToken = o.accessToken;
        row.refreshToken = o.refreshToken;
        row.oauthExpiresAt = o.expiresAt;
        break;
      }
      case CredentialType.PHONE: {
        const ph = cred as PhoneCredentialServer;
        row.identifier = (ph as any).phoneNumber;
        row.isVerified = (ph as any).isVerified ?? false;
        break;
      }
    }

    return row;
  }
}
