/**
 * AIProviderConfig Prisma Repository
 *
 * Prisma implementation of IAIProviderConfigRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type {
  PrismaClient,
  Prisma,
  AiProviderConfig as PrismaAiProviderConfig,
} from '@memoflow/database';
import type { IAIProviderConfigRepository } from '../../../domain';
import type { AIProviderConfigServerDTO } from '@memoflow/contracts/ai';
import type { AIProviderType } from '@memoflow/contracts/ai';
import type { IAIProviderSecretVault } from '../../../application/ports/provider-secret-vault.port';
import { AISecretCipher } from '../../security/ai-secret-cipher';

/**
 * AIProviderConfig Prisma Repository
 *
 * Prisma implementation of IAIProviderConfigRepository.
 */
export class AIProviderConfigPrismaRepository implements IAIProviderConfigRepository {
  private cipher: IAIProviderSecretVault | null;

  constructor(
    private readonly prisma: PrismaClient,
    secretCipher?: IAIProviderSecretVault,
  ) {
    this.cipher = secretCipher ?? null;
  }

  /**
   * 惰性解析加密器：只有真正加解密 provider 密钥时才读取 env 并 fail-fast，
   * 而不是在模块注册/构造时。这样未使用 AI provider 加密的路径（e2e 起服务、
   * 本地 dev、CI）无需配置 AI_PROVIDER_ENCRYPTION_KEY 即可启动，
   * 同时保证真正落库/读取密钥时缺 key 决不静默降级。
   */
  private get secretCipher(): IAIProviderSecretVault {
    return (this.cipher ??= AISecretCipher.fromEnv());
  }

  async save(config: AIProviderConfigServerDTO) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (config.isDefault) {
        await tx.$queryRawUnsafe(
          'SELECT pg_advisory_xact_lock(hashtext($1))',
          String(config.identityId),
        );
      }
      const existing = await tx.aiProviderConfig.findUnique({
        where: { id: String(config.id) },
        select: { identityId: true },
      });
      if (existing && existing.identityId !== String(config.identityId)) {
        throw new Error('Provider config not found for the current identity.');
      }

      if (config.isDefault) {
        await tx.aiProviderConfig.updateMany({
          where: {
            identityId: String(config.identityId),
            id: { not: String(config.id) },
            deletedAt: null,
          },
          data: { isDefault: false },
        });
      }

      await tx.aiProviderConfig.upsert({
        where: { id: String(config.id) },
        create: {
          id: String(config.id),
          identityId: String(config.identityId),
          name: config.name,
          providerType: config.providerType,
          baseUrl: config.baseUrl,
          apiKeyEncrypted: this.secretCipher.encrypt(this.secretCipher.decrypt(config.apiKey)),
          defaultModel: config.defaultModel,
          isActive: config.isActive,
          isDefault: config.isDefault,
          priority: config.priority,
          version: config.version,
          createdAt: new Date(config.createdAt),
          updatedAt: new Date(config.updatedAt),
          deletedAt: config.deletedAt ? new Date(config.deletedAt) : null,
        },
        update: {
          name: config.name,
          providerType: config.providerType,
          baseUrl: config.baseUrl,
          apiKeyEncrypted: this.secretCipher.encrypt(this.secretCipher.decrypt(config.apiKey)),
          defaultModel: config.defaultModel,
          isActive: config.isActive,
          isDefault: config.isDefault,
          priority: config.priority,
          version: config.version,
          updatedAt: new Date(config.updatedAt),
          deletedAt: config.deletedAt ? new Date(config.deletedAt) : null,
        },
      });
      return 'SAVED' as const;
    });
  }

  async findByIdForIdentity(
    identityId: string,
    id: string,
  ): Promise<AIProviderConfigServerDTO | null> {
    const row = await this.prisma.aiProviderConfig.findFirst({
      where: { id, identityId, deletedAt: null },
    });

    return row ? this.toServerDTO(row) : null;
  }

  async findByIdentityId(identityId: string): Promise<AIProviderConfigServerDTO[]> {
    const rows = await this.prisma.aiProviderConfig.findMany({
      where: { identityId, deletedAt: null },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    });

    return rows.map((row: PrismaAiProviderConfig) => this.toServerDTO(row));
  }

  async findDefaultByIdentityId(identityId: string): Promise<AIProviderConfigServerDTO | null> {
    const row = await this.prisma.aiProviderConfig.findFirst({
      where: { identityId, isDefault: true, isActive: true, deletedAt: null },
    });

    return row ? this.toServerDTO(row) : null;
  }

  async delete(identityId: string, id: string): Promise<void> {
    const updated = await this.prisma.aiProviderConfig.updateMany({
      where: { id, identityId, deletedAt: null },
      data: {
        isDefault: false,
        deletedAt: new Date(),
      },
    });
    if (updated.count !== 1) {
      throw new Error('Provider config not found for the current identity.');
    }
  }

  async setDefaultForIdentity(identityId: string, id: string) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', identityId);

      const provider = await tx.aiProviderConfig.findFirst({
        where: { id, identityId, isActive: true, deletedAt: null },
        select: { id: true },
      });
      if (!provider) {
        return 'NOT_FOUND' as const;
      }

      await tx.aiProviderConfig.updateMany({
        where: { identityId, id: { not: id }, deletedAt: null },
        data: { isDefault: false },
      });
      const updated = await tx.aiProviderConfig.updateMany({
        where: { id, identityId, isActive: true, deletedAt: null },
        data: { isDefault: true, version: { increment: 1 } },
      });
      return updated.count === 1 ? ('SET' as const) : ('CONFLICT' as const);
    });
  }

  private toServerDTO(row: PrismaAiProviderConfig): AIProviderConfigServerDTO {
    return {
      id: row.id as AIProviderConfigServerDTO['id'],
      identityId: row.identityId as AIProviderConfigServerDTO['identityId'],
      name: row.name,
      providerType: row.providerType as AIProviderType,
      baseUrl: row.baseUrl,
      apiKey: this.secretCipher.decrypt(row.apiKeyEncrypted),
      defaultModel: row.defaultModel,
      isActive: row.isActive,
      isDefault: row.isDefault,
      priority: row.priority,
      version: row.version,
      createdAt: new Date(row.createdAt).getTime(),
      updatedAt: new Date(row.updatedAt).getTime(),
      deletedAt: row.deletedAt ? new Date(row.deletedAt).getTime() : null,
    };
  }

}
