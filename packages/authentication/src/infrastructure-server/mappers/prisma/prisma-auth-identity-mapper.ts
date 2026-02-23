/**
 * Prisma AuthIdentity Aggregate Root Mapper
 *
 * 聚合根映射器（Boss Mapper）：
 * - toDomain:  Prisma DB rows → AuthIdentity 聚合根 (直接通过 ServerDTO)
 * - toPersistence: AuthIdentity 聚合根 → Prisma write data (含关联表)
 *
 * 调度子 Mapper 处理各关联表的映射：
 * - PrismaAuthIdentifierMapper  → auth_identifiers 表
 * - PrismaAuthCredentialMapper  → auth_credentials 表
 * - PrismaOAuthBindingMapper    → auth_oauth_bindings 表
 *
 * 设计原则：
 * - Repository 只和聚合根 Mapper 打交道
 * - 聚合根 Mapper 负责调度子 Mapper
 * - PersistenceDTO 已移除，mapper 直接在 DB Row ↔ ServerDTO 之间转换
 */

import type { AuthIdentityStatus } from '@dailyuse/database';
import type {
  AuthIdentityServerDTO,
  AuthIdentifierDTO,
  OAuthBindingServerDTO,
  AuthCredentialServerDTO,
  PasswordCredentialServerDTO,
} from '@dailyuse/contracts/authentication';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { AuthIdentity } from '../../../domain-server';
import type { PrismaAuthIdentityWithRelations } from '../../types';

import {
  AuthIdentityStatus as AuthIdentityStatusVO,
  CredentialType,
  CredentialStatus,
  HashedPassword,
  OAuthProvider,
  
} from '../../../domain-shared';
import { EmailIdentifier, PhoneIdentifier } from '../../../domain-server/value-objects';
import { OAuthBinding, PasswordCredential } from '../../../domain-server/entities';

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
    status: AuthIdentityStatus;
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
  // ========== DB → Domain ==========

  /**
   * Prisma row (with relations) → AuthIdentity 聚合根
   *
   * 路径：DB Rows → Domain Objects → AuthIdentity.load()
   */
  static toDomain(row: PrismaAuthIdentityWithRelations): AuthIdentity {
    const serverDTO = PrismaAuthIdentityMapper.toServerDTO(row);

    // Convert DTO identifiers to domain value objects
    const identifiers = (serverDTO.identifiers ?? []).map((dto: AuthIdentifierDTO) => {
      if (dto.type === 'EMAIL') return EmailIdentifier.fromDTO(dto);
      if (dto.type === 'PHONE') return PhoneIdentifier.fromDTO(dto);
      throw new Error(`Unknown identifier type: ${(dto as any).type}`);
    });

    // Convert DTO oauth bindings to domain entities
    const oauthBindings = (serverDTO.oauthBindings ?? []).map((dto: OAuthBindingServerDTO) => OAuthBinding.load({
      id: dto.id,
      provider: OAuthProvider.of(dto.provider),
      providerSubjectId: dto.providerSubjectId,
      accessToken: dto.accessToken ?? null,
      refreshToken: dto.refreshToken ?? null,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      createdAt: new Date(dto.createdAt),
      lastUsedAt: dto.lastUsedAt ? new Date(dto.lastUsedAt) : null,
    }));

    // Convert DTO credentials to domain entities
    const credentials = serverDTO.credentials.map((cred: AuthCredentialServerDTO) => {
      if (cred.type === CredentialType.PASSWORD) {
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
   * Prisma row (with relations) → AuthIdentityServerDTO
   *
   * 将 Prisma 返回的多表数据组装成领域层的 ServerDTO，
   * 委托子 Mapper 处理各关联表的转换。
   */
  static toServerDTO(row: PrismaAuthIdentityWithRelations): AuthIdentityServerDTO {
    return {
      id: IdentityId.of(row.id),
      status: row.status,
      failedLoginAttempts: row.failedLoginAttempts,
      lastFailedAttempt: row.lastFailedAttempt?.getTime() ?? null,
      lockedUntil: row.lockedUntil?.getTime() ?? null,

      // 调度子 Mapper
      identifiers: row.identifiers.map(PrismaAuthIdentifierMapper.toDomainDTO),
      oauthBindings: row.oauthBindings.map(PrismaOAuthBindingMapper.toDomainDTO),
      credentials: row.credentials.map(PrismaAuthCredentialMapper.toDomainDTO),

      version: row.version,
      createdAt: row.createdAt.getTime(),
      updatedAt: row.updatedAt.getTime(),
      deletedAt: row.deletedAt?.getTime() ?? null,
    };
  }

  // ========== Domain → DB ==========

  /**
   * AuthIdentity 聚合根 → Prisma 写入数据
   *
   * 路径：AuthIdentity.toServerDTO() → Prisma write data
   * 委托子 Mapper 处理关联表的转换。
   */
  static toPersistence(identity: AuthIdentity): AuthIdentityPrismaWriteData {
    const dto = identity.toServerDTO();
    const identityId = dto.id;

    return {
      identity: {
        id: dto.id,
        status: dto.status as AuthIdentityStatus,
        failedLoginAttempts: dto.failedLoginAttempts,
        lastFailedAttempt: dto.lastFailedAttempt ? new Date(dto.lastFailedAttempt) : null,
        lockedUntil: dto.lockedUntil ? new Date(dto.lockedUntil) : null,
        version: dto.version,
        createdAt: new Date(dto.createdAt),
        updatedAt: new Date(dto.updatedAt),
        deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      },
      identifiers: dto.identifiers.map((i) =>
        PrismaAuthIdentifierMapper.toPrismaCreate(i, identityId),
      ),
      oauthBindings: dto.oauthBindings.map((b) =>
        PrismaOAuthBindingMapper.toPrismaCreate(b, identityId),
      ),
      credentials: dto.credentials.map((c) =>
        PrismaAuthCredentialMapper.toPrismaCreate(c, identityId),
      ),
    };
  }
}
