/**
 * Prisma AuthIdentifier Sub-Mapper
 *
 * Sub-table mapper: handles auth_identifiers <-> AuthIdentifierDTO conversion.
 *
 * Responsibilities:
 * - DB Row -> AuthIdentifierDTO (read path)
 * - AuthIdentifierDTO -> Prisma CreateInput (write path)
 */

import type { Prisma } from '@dailyuse/database';
import type { AuthIdentifierDTO } from '@dailyuse/contracts/authentication';
import type { PrismaAuthIdentifierRow } from '../../../types';

export class PrismaAuthIdentifierMapper {
  /**
   * Row -> Domain DTO (read path).
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
   * Domain DTO -> Prisma CreateInput (write path).
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
