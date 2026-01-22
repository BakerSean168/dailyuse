import type {  PrismaClient  } from "@prisma/client";
import type { authCredential as PrismaAuthCredential } from '@prisma/client';
import type {
  IAuthCredentialRepository,
  AuthCredentialPrismaTransactionClient as PrismaTransactionClient,
} from '@dailyuse/domain-server/authentication';
import { AuthCredential } from '@dailyuse/domain-server/authentication';
import type { LoginRequest, RegisterRequest, AuthCredentialPersistenceDTO } from '@dailyuse/contracts/authentication';
import { CredentialType } from '@dailyuse/contracts/authentication';

export class PrismaAuthCredentialRepository implements IAuthCredentialRepository {
  constructor(private prisma: PrismaClient) {}

  private mapToEntity(data: PrismaAuthCredential): AuthCredential {
    try {
  const { data: jsonData, metadata, history, ...rest } = data;
      
      // 解析 JSON 字段
      const parsedData = JSON.parse(jsonData);
      const parsedMetadata = JSON.parse(metadata);

      // history 字段应该�?JSON 字符串，确保它是字符串格�?
      // 如果是空值，使用默认的空数组字符�?
      const historyString = history || '[]';
      
      // 🐛 DEBUG: Log all field types before DTO creation
      console.log('[DEBUG] mapToEntity - Field types before DTO creation:', {
        uuid: data.uuid,
        password_credential_type: typeof parsedData.password_credential,
        api_key_credentials_type: typeof parsedData.api_key_credentials,
        remember_me_tokens_type: typeof parsedData.remember_me_tokens,
        two_factor_type: typeof parsedData.two_factor,
        biometric_type: typeof parsedData.biometric,
        security_type: typeof parsedMetadata.security,
        history_type: typeof historyString,
        historyString,
      });

      const ensureJsonString = (value: unknown, defaultValue: string | null = null): string | null => {
        if (value == null) {
          return defaultValue;
        }
        if (typeof value === 'string') {
          return value;
        }
        try {
          return JSON.stringify(value);
        } catch (err) {
          console.error('[PrismaAuthCredentialRepository] Failed to serialize JSON field', {
            uuid: data.uuid,
            fieldValue: value,
            error: err instanceof Error ? err.message : String(err),
          });
          return defaultValue;
        }
      };

      // PersistenceDTO 中所有复杂对象字段都应该�?JSON 字符�?
      // 这里需要将已解析的对象转回字符�?
      const persistenceDTO: AuthCredentialPersistenceDTO = {
        ...rest,
        uuid: data.uuid,
        accountUuid: data.accountUuid,
        type: data.type as CredentialType,
        password_credential: ensureJsonString(parsedData.password_credential),
        api_key_credentials: ensureJsonString(parsedData.api_key_credentials, '[]') ?? '[]',
        remember_me_tokens: ensureJsonString(parsedData.remember_me_tokens, '[]') ?? '[]',
        two_factor: ensureJsonString(parsedData.two_factor),
        biometric: ensureJsonString(parsedData.biometric),
        status: parsedMetadata.status,
        security: ensureJsonString(parsedMetadata.security, '{}') ?? '{}',
        history: typeof historyString === 'string' ? historyString : JSON.stringify(historyString),
        createdAt: data.createdAt.getTime(),
        updatedAt: data.updatedAt.getTime(),
        expiresAt: data.expiresAt?.getTime(),
        lastUsedAt: data.lastUsedAt?.getTime(),
        revokedAt: data.revokedAt?.getTime(),
      };

      return AuthCredential.fromPersistenceDTO(persistenceDTO);
    } catch (error) {
      console.error('[PrismaAuthCredentialRepository] Failed to map entity', {
        uuid: data.uuid,
        accountUuid: data.accountUuid,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        rawData: {
          data: data.data?.substring(0, 100) + '...', // 截断避免日志过长
          metadata: data.metadata,
          history: data.history,
        },
      });
      throw error;
    }
  }

  private toDate(timestamp: number | null | undefined): Date | null | undefined {
    if (timestamp == null) return timestamp as null | undefined;
    return new Date(timestamp);
  }

  async save(credential: AuthCredential, tx?: PrismaTransactionClient): Promise<void> {
    try {
      const client = tx || this.prisma;
      const persistence = credential.toPersistenceDTO();
      const {
        uuid,
        accountUuid,
        type,
        password_credential,
        api_key_credentials,
        remember_me_tokens,
        two_factor,
        biometric,
        status,
        security,
        history,
        createdAt,
        updatedAt,
        expiresAt,
        lastUsedAt,
        revokedAt,
      } = persistence;

      const jsonData = JSON.stringify({
        password_credential,
        api_key_credentials,
        remember_me_tokens,
        two_factor,
        biometric,
      });

      const metadata = JSON.stringify({
        status,
        security,
      });

      // history 已经�?toPersistenceDTO() 中被序列化为字符�?
      // 确保它是字符串格�?
      const historyString = typeof history === 'string' ? history : JSON.stringify(history);

      const dataForPrisma = {
        uuid,
        accountUuid: accountUuid,
        type,
        data: jsonData,
        metadata,
        history: historyString, // 确保是字符串
        createdAt: this.toDate(createdAt) ?? new Date(),
        updatedAt: this.toDate(updatedAt) ?? new Date(),
        expiresAt: this.toDate(expiresAt),
        lastUsedAt: this.toDate(lastUsedAt),
        revokedAt: this.toDate(revokedAt),
      };

      await client.authCredential.upsert({
        where: { uuid: persistence.uuid },
        create: dataForPrisma,
        update: {
          type: dataForPrisma.type,
          data: dataForPrisma.data,
          metadata: dataForPrisma.metadata,
          history: dataForPrisma.history,
          updatedAt: dataForPrisma.updatedAt,
          expiresAt: dataForPrisma.expiresAt,
          lastUsedAt: dataForPrisma.lastUsedAt,
          revokedAt: dataForPrisma.revokedAt,
        },
      });
    } catch (error) {
      console.error('[PrismaAuthCredentialRepository] Save credential failed', {
        uuid: credential.uuid,
        accountUuid: credential.accountUuid,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  async findByUuid(uuid: string, tx?: PrismaTransactionClient): Promise<AuthCredential | null> {
    const client = tx || this.prisma;
    const data = await client.authCredential.findUnique({
      where: { uuid },
    });

    if (!data) {
      return null;
    }

    return this.mapToEntity(data);
  }

  async findByAccountUuid(
    accountUuid: string,
    tx?: PrismaTransactionClient,
  ): Promise<AuthCredential | null> {
    const client = tx || this.prisma;
    const data = await client.authCredential.findFirst({
      where: { accountUuid },
    });

    if (!data) {
      return null;
    }

    return this.mapToEntity(data);
  }

  async findAll(
    params?: { skip?: number; take?: number },
    tx?: PrismaTransactionClient,
  ): Promise<AuthCredential[]> {
    const client = tx || this.prisma;
    const data = await client.authCredential.findMany({
      skip: params?.skip,
      take: params?.take,
      orderBy: { createdAt: 'desc' },
    });

    return data.map((item: PrismaAuthCredential) => this.mapToEntity(item));
  }

  async findByStatus(
    status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED',
    params?: { skip?: number; take?: number },
    tx?: PrismaTransactionClient,
  ): Promise<AuthCredential[]> {
    const client = tx || this.prisma;
    const data = await client.authCredential.findMany({
      where: { metadata: { contains: `"status":"${status}"` } },
      skip: params?.skip,
      take: params?.take,
      orderBy: { createdAt: 'desc' },
    });
    return data.map((item: PrismaAuthCredential) => this.mapToEntity(item));
  }

  async findByType(
    type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY',
    params?: { skip?: number; take?: number },
    tx?: PrismaTransactionClient,
  ): Promise<AuthCredential[]> {
    const client = tx || this.prisma;
    const data = await client.authCredential.findMany({
      where: { type },
      skip: params?.skip,
      take: params?.take,
      orderBy: { createdAt: 'desc' },
    });

    return data.map((item: PrismaAuthCredential) => this.mapToEntity(item));
  }

  async existsByAccountUuid(accountUuid: string, tx?: PrismaTransactionClient): Promise<boolean> {
    const client = tx || this.prisma;
    const count = await client.authCredential.count({
      where: { accountUuid },
    });
    return count > 0;
  }

  async delete(uuid: string, tx?: PrismaTransactionClient): Promise<void> {
    const client = tx || this.prisma;
    await client.authCredential.delete({
      where: { uuid },
    });
  }

  async deleteExpired(tx?: PrismaTransactionClient): Promise<number> {
    const client = tx || this.prisma;
    const result = await client.authCredential.deleteMany({
      where: { metadata: { contains: '"status":"EXPIRED"' } },
    });
    return result.count;
  }
}

