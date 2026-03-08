/**
 * Prisma AuthIdentifier Sub-Mapper
 *
 * 子表映射器：处理 auth_identifiers �?�?AuthIdentifierDTO 值对�?
 *
 * 职责�?
 * - DB Row �?AuthIdentifierDTO (读数�?
 * - AuthIdentifierDTO �?Prisma CreateInput (写数�?
 */

import type { Prisma } from '@dailyuse/database';
import type { AuthIdentifierDTO } from '@dailyuse/contracts/authentication';
import type { PrismaAuthIdentifierRow } from '../../../types';

export class PrismaAuthIdentifierMapper {
  /**
   * Row �?Domain DTO (读数�?
   */
  static toDomainDTO(row: PrismaAuthIdentifierRow): AuthIdentifierDTO {
    if (row.type === 'Email') {
      return {
        type: 'Email',
        value: row.value,
        isVerified: row.isVerified ?? false,
      };
    }
    if (row.type === 'Phone') {
      return {
        type: 'Phone',
        value: { value: row.value },
        isVerified: row.isVerified ?? false,
      };
    }
    throw new Error(`Unknown identifier type: ${row.type}`);
  }

  /**
   * Domain DTO �?Prisma CreateInput (写数�?
   */
  static toPrismaCreate(
    identifier: AuthIdentifierDTO,
    identityId: string,
  ): Prisma.AuthIdentifierUncheckedCreateInput {
    return {
      identityId,
      type: identifier.type,
      value:
        identifier.type === 'Phone'
          ? (identifier.value as { value: string }).value
          : (identifier.value as string),
      isVerified: identifier.isVerified,
    };
  }
}
