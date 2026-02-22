/**
 * Prisma AuthOAuthBinding Sub-Mapper
 *
 * 子表映射器：处理 auth_oauth_bindings 表 ↔ OAuthBindingServerDTO
 *
 * 职责：
 * - DB Row → OAuthBindingServerDTO (读数据)
 * - OAuthBindingServerDTO → Prisma CreateInput (写数据)
 */

import type { Prisma } from '@dailyuse/database';
import type { OAuthBindingServerDTO } from '@dailyuse/contracts/authentication';
import type { PrismaAuthOAuthBindingRow } from '../../types';

export class PrismaOAuthBindingMapper {
  /**
   * Row → Domain DTO (读数据)
   *
   * Date → number (timestamp) 转换
   */
  static toDomainDTO(row: PrismaAuthOAuthBindingRow): OAuthBindingServerDTO {
    return {
      id: row.id,
      provider: row.provider,
      providerSubjectId: row.providerSubjectId,
      accessToken: row.accessToken ?? null,
      refreshToken: row.refreshToken ?? null,
      expiresAt: row.expiresAt?.getTime() ?? null,
      createdAt: row.createdAt.getTime(),
      lastUsedAt: row.lastUsedAt?.getTime() ?? null,
    };
  }

  /**
   * Domain DTO → Prisma CreateInput (写数据)
   *
   * number (timestamp) → Date 转换
   */
  static toPrismaCreate(
    binding: OAuthBindingServerDTO,
    identityId: string,
  ): Prisma.AuthOAuthBindingUncheckedCreateInput {
    return {
      id: binding.id,
      identityId,
      provider: binding.provider as string,
      providerSubjectId: binding.providerSubjectId,
      accessToken: binding.accessToken,
      refreshToken: binding.refreshToken,
      expiresAt: binding.expiresAt ? new Date(binding.expiresAt) : null,
      createdAt: new Date(binding.createdAt),
      lastUsedAt: binding.lastUsedAt ? new Date(binding.lastUsedAt) : null,
    };
  }
}
