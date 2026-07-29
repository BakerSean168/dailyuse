/**
 * Prisma AuthOAuthBinding Sub-Mapper
 *
 * Sub-table mapper: handles auth_oauth_bindings <-> OAuthBindingServerDTO conversion.
 *
 * Responsibilities:
 * - DB Row -> OAuthBindingServerDTO (read path)
 * - OAuthBindingServerDTO -> Prisma CreateInput (write path)
 */

import type { Prisma } from '@memoflow/database';
import type { OAuthBindingServerDTO, OAuthProvider } from '@memoflow/contracts/authentication';
import type { PrismaAuthOAuthBindingRow } from '../../../types';

export class PrismaOAuthBindingMapper {
  /**
   * Row -> Domain DTO (read path).
   *
   * Converts Date to number (timestamp).
   */
  static toDomainDTO(row: PrismaAuthOAuthBindingRow): OAuthBindingServerDTO {
    return {
      id: row.id,
      provider: row.provider as OAuthProvider,
      providerSubjectId: row.providerSubjectId,
      accessToken: row.accessToken ?? null,
      refreshToken: row.refreshToken ?? null,
      expiresAt: row.expiresAt?.getTime() ?? null,
      createdAt: row.createdAt.getTime(),
      lastUsedAt: row.lastUsedAt?.getTime() ?? null,
    };
  }

  /**
   * Domain DTO -> Prisma CreateInput (write path).
   *
   * Converts number (timestamp) to Date.
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
