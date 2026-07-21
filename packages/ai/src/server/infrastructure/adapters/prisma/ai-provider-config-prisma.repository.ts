/**
 * AIProviderConfig Prisma Repository
 *
 * Prisma implementation of IAIProviderConfigRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { PrismaClient, AiProviderConfig as PrismaAiProviderConfig } from '@dailyuse/database';
import type { IAIProviderConfigRepository } from '../../../domain';
import type { AIModelInfo, AIProviderConfigServerDTO } from '@dailyuse/contracts/ai';
import type { AIProviderType } from '@dailyuse/contracts/ai';
import { AISecretCipher } from '../../security/ai-secret-cipher';

/**
 * AIProviderConfig Prisma Repository
 *
 * Prisma implementation of IAIProviderConfigRepository.
 */
export class AIProviderConfigPrismaRepository implements IAIProviderConfigRepository {
  private cipher: AISecretCipher | null;

  constructor(
    private readonly prisma: PrismaClient,
    secretCipher?: AISecretCipher,
  ) {
    this.cipher = secretCipher ?? null;
  }

  /**
   * 惰性解析加密器：只有真正加解密 provider 密钥时才读取 env 并 fail-fast，
   * 而不是在模块注册/构造时。这样未使用 AI provider 加密的路径（e2e 起服务、
   * 本地 dev、CI）无需配置 AI_PROVIDER_ENCRYPTION_KEY 即可启动，
   * 同时保证真正落库/读取密钥时缺 key 决不静默降级。
   */
  private get secretCipher(): AISecretCipher {
    return (this.cipher ??= AISecretCipher.fromEnv());
  }

  async save(config: AIProviderConfigServerDTO): Promise<void> {
    await this.prisma.aiProviderConfig.upsert({
      where: { id: String(config.id) },
      create: {
        id: String(config.id),
        identityId: String(config.identityId),
        name: config.name,
        providerType: config.providerType,
        baseUrl: config.baseUrl,
        apiKeyEncrypted: this.secretCipher.encrypt(this.secretCipher.decrypt(config.apiKey)),
        defaultModel: config.defaultModel,
        availableModels: JSON.stringify(config.availableModels ?? []),
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
        availableModels: JSON.stringify(config.availableModels ?? []),
        isActive: config.isActive,
        isDefault: config.isDefault,
        priority: config.priority,
        version: config.version,
        updatedAt: new Date(config.updatedAt),
        deletedAt: config.deletedAt ? new Date(config.deletedAt) : null,
      },
    });
  }

  async findById(id: string): Promise<AIProviderConfigServerDTO | null> {
    const row = await this.prisma.aiProviderConfig.findFirst({
      where: { id, deletedAt: null },
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

  async delete(id: string): Promise<void> {
    await this.prisma.aiProviderConfig.update({
      where: { id },
      data: {
        isDefault: false,
        deletedAt: new Date(),
      },
    });
  }

  async clearDefaultForIdentity(identityId: string): Promise<void> {
    await this.prisma.aiProviderConfig.updateMany({
      where: { identityId, deletedAt: null },
      data: { isDefault: false },
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
      availableModels: this.parseModels(row.availableModels),
      isActive: row.isActive,
      isDefault: row.isDefault,
      priority: row.priority,
      version: row.version,
      createdAt: new Date(row.createdAt).getTime(),
      updatedAt: new Date(row.updatedAt).getTime(),
      deletedAt: row.deletedAt ? new Date(row.deletedAt).getTime() : null,
    };
  }

  private parseModels(value: string | null): AIModelInfo[] {
    if (!value) {
      return [];
    }

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as AIModelInfo[]) : [];
    } catch {
      return [];
    }
  }
}
