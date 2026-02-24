/**
 * Prisma AuthOAuthBinding Sub-Mapper
 *
 * Â≠êË°®Êò†Â∞ÑÂô®ÔºöÂ§ÑÁêÜ auth_oauth_bindings Ë°?‚Ü?OAuthBindingServerDTO
 *
 * ËÅåË¥£Ôº?
 * - DB Row ‚Ü?OAuthBindingServerDTO (ËØªÊï∞Êç?
 * - OAuthBindingServerDTO ‚Ü?Prisma CreateInput (ÂÜôÊï∞Êç?
 */

import type { Prisma } from '@dailyuse/database';
import type { OAuthBindingServerDTO, OAuthProvider } from '@dailyuse/contracts/authentication';
import type { PrismaAuthOAuthBindingRow } from '../../../types';

export class PrismaOAuthBindingMapper {
  /**
   * Row ‚Ü?Domain DTO (ËØªÊï∞Êç?
   *
   * Date ‚Ü?number (timestamp) ËΩ¨Êç¢
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
   * Domain DTO ‚Ü?Prisma CreateInput (ÂÜôÊï∞Êç?
   *
   * number (timestamp) ‚Ü?Date ËΩ¨Êç¢
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
