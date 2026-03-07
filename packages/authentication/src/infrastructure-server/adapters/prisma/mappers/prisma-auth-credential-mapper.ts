/**
 * Prisma AuthCredential Sub-Mapper
 *
 * 子表映射器：处理 auth_credentials �?�?AuthCredentialServerDTO
 *
 * 职责�?
 * - DB Row �?AuthCredentialServerDTO (读数�?
 * - AuthCredentialServerDTO �?Prisma CreateInput (写数�?
 */

import type { Prisma } from '@dailyuse/database';
import type {
  AuthCredentialServerDTO,
  PasswordCredentialServerDTO,
  HashedPassword,
  CredentialStatus,
  AuthCredentialId,
} from '@dailyuse/contracts/authentication';
import { CredentialType, PasswordAlgorithm } from '../../../../domain-shared';
import type { PrismaAuthCredentialRow } from '../../../types';

export class PrismaAuthCredentialMapper {
  /**
   * Row �?Domain DTO (读数�?
   *
   * �?Prisma 行数据转换为领域层认识的 ServerDTO�?
   * - 数据库的 passwordHash 字段 �?领域�?hashedPassword
   * - Date �?number (timestamp)
   */
  static toDomainDTO(row: PrismaAuthCredentialRow): AuthCredentialServerDTO {
    const base = {
      id: row.id as AuthCredentialId,
      status: row.status as CredentialStatus,
      createdAt: row.createdAt.getTime(),
      lastUsedAt: row.lastUsedAt?.getTime() ?? null,
    };

    if (row.type === CredentialType.Password) {
      // Parse Argon2 hash string into structured HashedPassword DTO
      // Format: $argon2id$v=19$m=65536,t=3,p=4$salt$hash
      const hashStr = row.passwordHash ?? '';
      const parts = hashStr.split('$');
      const salt = parts.length >= 6 ? parts[4] : '';

      const hashedPassword: HashedPassword = {
        hash: hashStr,
        salt,
        algorithm: PasswordAlgorithm.Argon2 as string as HashedPassword['algorithm'],
        createdAt: row.passwordLastChangedAt?.getTime() ?? row.createdAt.getTime(),
      };

      const result: PasswordCredentialServerDTO = {
        ...base,
        type: CredentialType.Password as 'Password',
        hashedPassword,
        passwordLastChangedAt: row.passwordLastChangedAt?.getTime() ?? row.createdAt.getTime(),
      };
      return result;
    }

    throw new Error(`Unknown credential type: ${row.type}`);
  }

  /**
   * Domain DTO �?Prisma CreateInput (写数�?
   *
   * 将领域层�?ServerDTO 转换�?Prisma 写入格式�?
   * - hashedPassword �?passwordHash
   * - timestamp (number) �?Date
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

    if (cred.type === CredentialType.Password) {
      const p = cred as PasswordCredentialServerDTO;
      row.passwordHash = p.hashedPassword.hash;
      row.passwordLastChangedAt = new Date(p.passwordLastChangedAt);
    }

    return row;
  }
}
