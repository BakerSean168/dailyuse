/**
 * Prisma AuthIdentity Aggregate Root Mapper
 *
 * Aggregate root mapper (orchestrator):
 * - toDomain:      Prisma DB rows -> AuthIdentity aggregate root (via ServerDTO)
 * - toPersistence: AuthIdentity aggregate root -> Prisma write data (with relations)
 *
 * Delegates to sub-mappers for each related table:
 * - PrismaAuthIdentifierMapper  (auth_identifiers table)
 * - PrismaAuthCredentialMapper  (auth_credentials table)
 * - PrismaOAuthBindingMapper    (auth_oauth_bindings table)
 *
 * Design principles:
 * - Repository only interacts with the aggregate root mapper
 * - Aggregate root mapper orchestrates sub-mappers
 * - No PersistenceDTO; mapper converts directly between DB Row and ServerDTO
 */

import type {
  AuthIdentityServerDTO,
  AuthIdentifierDTO,
  OAuthBindingServerDTO,
  AuthCredentialServerDTO,
  PasswordCredentialServerDTO,
} from '@dailyuse/contracts/authentication';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { AuthIdentity } from '../../../../domain';
import type { PrismaAuthIdentityWithRelations } from '../../../types';

import {
  AuthIdentityStatus as AuthIdentityStatusVO,
  CredentialType,
  CredentialStatus,
  HashedPassword,
  OAuthProvider,
} from '../../../../domain';
import { EmailIdentifier, PhoneIdentifier } from '../../../../domain/value-objects';
import { OAuthBinding, PasswordCredential } from '../../../../domain/entities';

import { PrismaAuthIdentifierMapper } from './prisma-auth-identifier-mapper';
import { PrismaAuthCredentialMapper } from './prisma-auth-credential-mapper';
import { PrismaOAuthBindingMapper } from './prisma-oauth-binding-mapper';

// Re-export sub-mappers for direct usage if needed
export { PrismaAuthIdentifierMapper } from './prisma-auth-identifier-mapper';
export { PrismaAuthCredentialMapper } from './prisma-auth-credential-mapper';
export { PrismaOAuthBindingMapper } from './prisma-oauth-binding-mapper';

// ============ Write Data Types ============

/** Prisma write data for AuthIdentity + all relations */
export interface AuthIdentityPrismaWriteData {
  identity: {
    id: string;
    status: AuthIdentityStatusVO;
    failedLoginAttempts: number;
    lastFailedAttempt: Date | null;
    lockedUntil: Date | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  };
  identifiers: ReturnType<typeof PrismaAuthIdentifierMapper.toPrismaCreate>[];
  oauthBindings: ReturnType<typeof PrismaOAuthBindingMapper.toPrismaCreate>[];
  credentials: ReturnType<typeof PrismaAuthCredentialMapper.toPrismaCreate>[];
}

// ============ Mapper ============

export class PrismaAuthIdentityMapper {
  // ========== DB -> Domain ==========

  /**
   * Prisma row (with relations) -> AuthIdentity aggregate root.
   *
   * Path: DB Rows -> Domain Objects -> AuthIdentity.load()
   */
  static toDomain(row: PrismaAuthIdentityWithRelations): AuthIdentity {
    const serverDTO = PrismaAuthIdentityMapper.toServerDTO(row);

    // Convert DTO identifiers to domain value objects
    const identifiers = (serverDTO.identifiers ?? []).map((dto: AuthIdentifierDTO) => {
      if (dto.type === 'Email') return EmailIdentifier.fromDTO(dto);
      if (dto.type === 'Phone') return PhoneIdentifier.fromDTO(dto);
      throw new Error(`Unknown identifier type: ${(dto as Record<string, unknown>).type}`);
    });

    // Convert DTO oauth bindings to domain entities
    const oauthBindings = (serverDTO.oauthBindings ?? []).map((dto: OAuthBindingServerDTO) =>
      OAuthBinding.load({
        id: dto.id,
        provider: OAuthProvider.of(dto.provider),
        providerSubjectId: dto.providerSubjectId,
        accessToken: dto.accessToken ?? null,
        refreshToken: dto.refreshToken ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdAt: new Date(dto.createdAt),
        lastUsedAt: dto.lastUsedAt ? new Date(dto.lastUsedAt) : null,
      }),
    );

    // Convert DTO credentials to domain entities
    const credentials = serverDTO.credentials.map((cred: AuthCredentialServerDTO) => {
      if (cred.type === CredentialType.Password) {
        const p = cred as PasswordCredentialServerDTO;
        return PasswordCredential.load({
          id: p.id,
          status: CredentialStatus.of(p.status),
          hashedPassword: HashedPassword.fromDTO(p.hashedPassword),
          passwordLastChangedAt: new Date(p.passwordLastChangedAt),
          createdAt: new Date(p.createdAt),
          lastUsedAt: p.lastUsedAt ? new Date(p.lastUsedAt) : null,
        });
      }
      throw new Error(`Unknown credential type: ${cred.type}`);
    });

    return AuthIdentity.load({
      id: serverDTO.id,
      status: AuthIdentityStatusVO.of(serverDTO.status),
      failedLoginAttempts: serverDTO.failedLoginAttempts,
      lastFailedAttempt: serverDTO.lastFailedAttempt ? new Date(serverDTO.lastFailedAttempt) : null,
      lockedUntil: serverDTO.lockedUntil ? new Date(serverDTO.lockedUntil) : null,
      identifiers,
      oauthBindings,
      credentials,
      version: serverDTO.version ?? 1,
      createdAt: new Date(serverDTO.createdAt),
      updatedAt: new Date(serverDTO.updatedAt),
      deletedAt: serverDTO.deletedAt ? new Date(serverDTO.deletedAt) : null,
    });
  }

  /**
   * Prisma row (with relations) -> AuthIdentityServerDTO.
   *
   * Assembles multi-table Prisma data into a domain-layer ServerDTO.
   * Delegates to sub-mappers for each related table conversion.
   */
  static toServerDTO(row: PrismaAuthIdentityWithRelations): AuthIdentityServerDTO {
    return {
      id: IdentityId.of(row.id),
      status: AuthIdentityStatusVO.of(row.status),
      failedLoginAttempts: row.failedLoginAttempts,
      lastFailedAttempt: row.lastFailedAttempt?.getTime() ?? null,
      lockedUntil: row.lockedUntil?.getTime() ?? null,

      // Delegate to sub-mappers
      identifiers: row.identifiers.map(PrismaAuthIdentifierMapper.toDomainDTO),
      oauthBindings: row.oauthBindings.map(PrismaOAuthBindingMapper.toDomainDTO),
      credentials: row.credentials.map(PrismaAuthCredentialMapper.toDomainDTO),

      version: row.version,
      createdAt: row.createdAt.getTime(),
      updatedAt: row.updatedAt.getTime(),
      deletedAt: row.deletedAt?.getTime() ?? null,
    };
  }

  // ========== Domain -> DB ==========

  /**
   * AuthIdentity aggregate root -> Prisma write data.
   *
   * Path: AuthIdentity.toServerDTO() -> Prisma write data.
   * Delegates to sub-mappers for related table conversions.
   */
  static toPersistence(identity: AuthIdentity): AuthIdentityPrismaWriteData {
    const dto = identity.toServerDTO();
    const identityId = dto.id;

    return {
      identity: {
        id: dto.id,
        status: AuthIdentityStatusVO.of(dto.status),
        failedLoginAttempts: dto.failedLoginAttempts,
        lastFailedAttempt: dto.lastFailedAttempt ? new Date(dto.lastFailedAttempt) : null,
        lockedUntil: dto.lockedUntil ? new Date(dto.lockedUntil) : null,
        version: dto.version,
        createdAt: new Date(dto.createdAt),
        updatedAt: new Date(dto.updatedAt),
        deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      },
      identifiers: dto.identifiers.map((i: AuthIdentifierDTO) =>
        PrismaAuthIdentifierMapper.toPrismaCreate(i, identityId),
      ),
      oauthBindings: dto.oauthBindings.map((b: OAuthBindingServerDTO) =>
        PrismaOAuthBindingMapper.toPrismaCreate(b, identityId),
      ),
      credentials: dto.credentials.map((c: AuthCredentialServerDTO) =>
        PrismaAuthCredentialMapper.toPrismaCreate(c, identityId),
      ),
    };
  }
}
