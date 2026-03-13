/**
 * Prisma AuthCredential Sub-Mapper
 *
 * Sub-table mapper: handles auth_credentials <-> AuthCredentialServerDTO conversion.
 *
 * Responsibilities:
 * - DB Row -> AuthCredentialServerDTO (read path)
 * - AuthCredentialServerDTO -> Prisma CreateInput (write path)
 */

import type { Prisma } from '@dailyuse/database';
import type {
  AuthCredentialServerDTO,
  PasswordCredentialServerDTO,
  HashedPassword,
  CredentialStatus,
  AuthCredentialId,
} from '@dailyuse/contracts/authentication';
import {
  CredentialType,
  CredentialStatus as CredentialStatusVO,
  PasswordAlgorithm,
} from '../../../../domain-shared';
import type { PrismaAuthCredentialRow } from '../../../types';

export class PrismaAuthCredentialMapper {
  /**
   * Row -> Domain DTO (read path).
   *
   * Converts Prisma row data to a domain-layer ServerDTO:
   * - Maps the passwordHash DB column to the domain hashedPassword field
   * - Converts Date to number (timestamp)
   */
  static toDomainDTO(row: PrismaAuthCredentialRow): AuthCredentialServerDTO {
    const base = {
      id: row.id as AuthCredentialId,
      status: CredentialStatusVO.of(row.status) as unknown as CredentialStatus,
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
   * Domain DTO -> Prisma CreateInput (write path).
   *
   * Converts a domain-layer ServerDTO to Prisma write format:
   * - Maps hashedPassword to passwordHash
   * - Converts timestamp (number) to Date
   */
  static toPrismaCreate(
    cred: AuthCredentialServerDTO,
    identityId: string,
  ): Prisma.AuthCredentialUncheckedCreateInput {
    const row: Prisma.AuthCredentialUncheckedCreateInput = {
      id: cred.id,
      identityId,
      type: cred.type as unknown as Prisma.AuthCredentialUncheckedCreateInput['type'],
      status: cred.status as unknown as Prisma.AuthCredentialUncheckedCreateInput['status'],
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
