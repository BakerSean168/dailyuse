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
} from '@dailyuse/contracts/authentication';
import { AuthIdentity } from '../../../domain-server';
import type { PrismaAuthIdentityWithRelations } from '../../types';

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
   * 路径：DB Rows → ServerDTO → AuthIdentity.fromServerDTO()
   */
  static toDomain(row: PrismaAuthIdentityWithRelations): AuthIdentity {
    const serverDTO = PrismaAuthIdentityMapper.toServerDTO(row);
    return AuthIdentity.fromServerDTO(serverDTO);
  }

  /**
   * Prisma row (with relations) → AuthIdentityServerDTO
   *
   * 将 Prisma 返回的多表数据组装成领域层的 ServerDTO，
   * 委托子 Mapper 处理各关联表的转换。
   */
  static toServerDTO(row: PrismaAuthIdentityWithRelations): AuthIdentityServerDTO {
    return {
      id: row.id,
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
