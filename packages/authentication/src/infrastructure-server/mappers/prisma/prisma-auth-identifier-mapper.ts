/**
 * Prisma AuthIdentifier Sub-Mapper
 *
 * 子表映射器：处理 auth_identifiers 表 ↔ AuthIdentifierDTO 值对象
 *
 * 职责：
 * - DB Row → AuthIdentifierDTO (读数据)
 * - AuthIdentifierDTO → Prisma CreateInput (写数据)
 */

import type { Prisma } from '@dailyuse/database';
import type { AuthIdentifierDTO } from '@dailyuse/contracts/authentication';
import type { PrismaAuthIdentifierRow } from '../../types';

export class PrismaAuthIdentifierMapper {
  /**
   * Row → Domain DTO (读数据)
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
   * Domain DTO → Prisma CreateInput (写数据)
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
