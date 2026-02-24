/**
 * Prisma AuthIdentifier Sub-Mapper
 *
 * å­è¡¨æ˜ å°„å™¨ï¼šå¤„ç† auth_identifiers è¡?â†?AuthIdentifierDTO å€¼å¯¹è±?
 *
 * èŒè´£ï¼?
 * - DB Row â†?AuthIdentifierDTO (è¯»æ•°æ?
 * - AuthIdentifierDTO â†?Prisma CreateInput (å†™æ•°æ?
 */

import type { Prisma } from '@dailyuse/database';
import type { AuthIdentifierDTO } from '@dailyuse/contracts/authentication';
import type { PrismaAuthIdentifierRow } from '../../../types';

export class PrismaAuthIdentifierMapper {
  /**
   * Row â†?Domain DTO (è¯»æ•°æ?
   */
  static toDomainDTO(row: PrismaAuthIdentifierRow): AuthIdentifierDTO {
    if (row.type === 'EMAIL') {
      return {
        type: 'EMAIL',
        value: row.value,
        isVerified: row.isVerified ?? false,
      };
    }
    if (row.type === 'PHONE') {
      return {
        type: 'PHONE',
        value: { value: row.value },
        isVerified: row.isVerified ?? false,
      };
    }
    throw new Error(`Unknown identifier type: ${row.type}`);
  }

  /**
   * Domain DTO â†?Prisma CreateInput (å†™æ•°æ?
   */
  static toPrismaCreate(
    identifier: AuthIdentifierDTO,
    identityId: string,
  ): Prisma.AuthIdentifierUncheckedCreateInput {
    return {
      identityId,
      type: identifier.type,
      value:
        identifier.type === 'PHONE'
          ? (identifier.value as { value: string }).value
          : (identifier.value as string),
      isVerified: identifier.isVerified,
    };
  }
}
