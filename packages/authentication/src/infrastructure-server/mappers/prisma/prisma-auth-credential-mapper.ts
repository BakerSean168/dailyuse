/**
 * Prisma AuthCredential Sub-Mapper
 *
 * 子表映射器：处理 auth_credentials 表 ↔ AuthCredentialServerDTO
 *
 * 职责：
 * - DB Row → AuthCredentialServerDTO (读数据)
 * - AuthCredentialServerDTO → Prisma CreateInput (写数据)
 */

import type { Prisma } from '@dailyuse/database';
import type {
  AuthCredentialServerDTO,
  PasswordCredentialServerDTO,
} from '@dailyuse/contracts/authentication';
import { CredentialType } from '../../../domain-shared';
import type { PrismaAuthCredentialRow } from '../../types';

export class PrismaAuthCredentialMapper {
  /**
   * Row → Domain DTO (读数据)
   *
   * 将 Prisma 行数据转换为领域层认识的 ServerDTO：
   * - 数据库的 passwordHash 字段 → 领域的 hashedPassword
   * - Date → number (timestamp)
   */
  static toDomainDTO(row: PrismaAuthCredentialRow): AuthCredentialServerDTO {
    const base = {
      id: row.id,
      status: row.status,
      createdAt: row.createdAt.getTime(),
      lastUsedAt: row.lastUsedAt?.getTime() ?? null,
    };

    if (row.type === CredentialType.PASSWORD || row.type === 'PASSWORD') {
      return {
        ...base,
        type: CredentialType.PASSWORD,
        hashedPassword: row.passwordHash,
        passwordLastChangedAt: row.passwordLastChangedAt?.getTime() ?? row.createdAt.getTime(),
      } as PasswordCredentialServerDTO;
    }

    throw new Error(`Unknown credential type: ${row.type}`);
  }

  /**
   * Domain DTO → Prisma CreateInput (写数据)
   *
   * 将领域层的 ServerDTO 转换为 Prisma 写入格式：
   * - hashedPassword → passwordHash
   * - timestamp (number) → Date
   */
  static toPrismaCreate(
    cred: AuthCredentialServerDTO,
    identityId: string,
  ): Prisma.AuthCredentialUncheckedCreateInput {
    const row: Prisma.AuthCredentialUncheckedCreateInput = {
      id: cred.id,
      identityId,
      type: cred.type,
      status: cred.status,
      createdAt: new Date(cred.createdAt),
      lastUsedAt: cred.lastUsedAt ? new Date(cred.lastUsedAt) : null,
    };

    if (cred.type === CredentialType.PASSWORD || cred.type === 'PASSWORD') {
      const p = cred as PasswordCredentialServerDTO;
      row.passwordHash = p.hashedPassword;
      row.passwordLastChangedAt = new Date(p.passwordLastChangedAt);
    }

    return row;
  }
}
