/**
 * Prisma AI Provider Config Repository
 * AI 服务提供商配置仓储实现
 *
 * 职责：
 * - 操作 ai_provider_configs 表
 * - ServerDTO ↔ Prisma Model 映射
 * - API Key 加密/解密处理
 *
 * 安全说明：
 * - API Key 使用 AES-256-GCM 加密存储
 * - 加密密钥从环境变量 AI_PROVIDER_ENCRYPTION_KEY 读取
 */

import type { PrismaClient } from '@prisma/client';
import type { IAIProviderConfigRepository } from '@dailyuse/domain-server/ai';
import type { AIProviderConfigServerDTO, AIModelInfo } from '@dailyuse/contracts/ai';
import { AIProviderType } from '@dailyuse/contracts/ai';
import { env } from '@/shared/infrastructure/config/env.js';
import crypto from 'crypto';

// 使用 any 类型绕过 Prisma 类型生成延迟问题
// Prisma client 已包含 aiProviderConfig 模型，但 TypeScript 可能未及时更新
type PrismaClientWithAIProvider = PrismaClient & {
  aiProviderConfig: {
    upsert: (args: any) => Promise<any>;
    findUnique: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    findFirst: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    count: (args: any) => Promise<number>;
    updateMany: (args: any) => Promise<any>;
  };
};

// 加密配置
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * PrismaAIProviderConfigRepository 实现
 */
export class PrismaAIProviderConfigRepository implements IAIProviderConfigRepository {
  private encryptionKey: Buffer;
  private prismaWithAI: PrismaClientWithAIProvider;

  constructor(private prisma: PrismaClient) {
    // 从环境变量获取加密密钥，如果没有则使用默认密钥（仅开发环境）
    const keyStr = env.AI_PROVIDER_ENCRYPTION_KEY || 'default-dev-key-32-bytes-long!!';
    this.encryptionKey = crypto.scryptSync(keyStr, 'salt', 32);
    // 类型断言：运行时 Prisma client 已包含 aiProviderConfig
    this.prismaWithAI = prisma as PrismaClientWithAIProvider;
  }

  /**
   * 保存配置（UPSERT 语义）
   */
  async save(config: AIProviderConfigServerDTO): Promise<void> {
    const encryptedApiKey = this.encryptApiKey(config.apiKey);
    const availableModelsJson = JSON.stringify(config.availableModels);

    await this.prismaWithAI.aiProviderConfig.upsert({
      where: { uuid: config.uuid },
      create: {
        uuid: config.uuid,
        accountUuid: config.accountUuid,
        name: config.name,
        providerType: config.providerType,
        baseUrl: config.baseUrl,
        apiKeyEncrypted: encryptedApiKey,
        defaultModel: config.defaultModel,
        availableModels: availableModelsJson,
        isActive: config.isActive,
        isDefault: config.isDefault,
        priority: config.priority ?? 100,
        createdAt: new Date(config.createdAt),
        updatedAt: new Date(config.updatedAt),
      },
      update: {
        name: config.name,
        providerType: config.providerType,
        baseUrl: config.baseUrl,
        apiKeyEncrypted: encryptedApiKey,
        defaultModel: config.defaultModel,
        availableModels: availableModelsJson,
        isActive: config.isActive,
        isDefault: config.isDefault,
        priority: config.priority ?? 100,
        updatedAt: new Date(config.updatedAt),
      },
    });
  }

  /**
   * 根据 UUID 查找配置
   */
  async findByUuid(uuid: string): Promise<AIProviderConfigServerDTO | null> {
    const record = await this.prismaWithAI.aiProviderConfig.findUnique({
      where: { uuid },
    });

    return record ? this.toServerDTO(record) : null;
  }

  /**
   * 根据账户 UUID 查找所有配置
   */
  async findByAccountUuid(accountUuid: string): Promise<AIProviderConfigServerDTO[]> {
    const records = await this.prismaWithAI.aiProviderConfig.findMany({
      where: { accountUuid },
      orderBy: [{ priority: 'asc' }, { isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    return records.map((record: any) => this.toServerDTO(record));
  }

  /**
   * 查找账户的默认 Provider
   */
  async findDefaultByAccountUuid(accountUuid: string): Promise<AIProviderConfigServerDTO | null> {
    const record = await this.prismaWithAI.aiProviderConfig.findFirst({
      where: {
        accountUuid,
        isDefault: true,
        isActive: true,
      },
    });

    return record ? this.toServerDTO(record) : null;
  }

  /**
   * 根据账户和名称查找（用于唯一性检查）
   */
  async findByAccountUuidAndName(
    accountUuid: string,
    name: string,
  ): Promise<AIProviderConfigServerDTO | null> {
    const record = await this.prismaWithAI.aiProviderConfig.findFirst({
      where: { accountUuid, name },
    });

    return record ? this.toServerDTO(record) : null;
  }

  /**
   * 删除配置
   */
  async delete(uuid: string): Promise<void> {
    await this.prismaWithAI.aiProviderConfig.delete({
      where: { uuid },
    });
  }

  /**
   * 检查配置是否存在
   */
  async exists(uuid: string): Promise<boolean> {
    const count = await this.prismaWithAI.aiProviderConfig.count({
      where: { uuid },
    });
    return count > 0;
  }

  /**
   * 取消账户下所有 Provider 的默认状态
   */
  async clearDefaultForAccount(accountUuid: string): Promise<void> {
    await this.prismaWithAI.aiProviderConfig.updateMany({
      where: { accountUuid, isDefault: true },
      data: { isDefault: false },
    });
  }

  // ===== 加密/解密方法 =====

  /**
   * 加密 API Key
   */
  private encryptApiKey(apiKey: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, this.encryptionKey, iv);

    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // 格式: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * 解密 API Key
   */
  private decryptApiKey(encryptedData: string): string {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Failed to decrypt API key:', error);
      throw new Error('Failed to decrypt API key');
    }
  }

  // ===== 映射方法 =====

  /**
   * 映射：Prisma Model → ServerDTO
   */
  private toServerDTO(record: any): AIProviderConfigServerDTO {
    // 映射 providerType 字符串 → 枚举
    let providerType: AIProviderType;
    switch (record.providerType) {
      case 'OPENAI':
        providerType = AIProviderType.OPENAI;
        break;
      case 'QINIU':
        providerType = AIProviderType.QINIU;
        break;
      case 'ANTHROPIC':
        providerType = AIProviderType.ANTHROPIC;
        break;
      case 'OPENROUTER':
        providerType = AIProviderType.OPENROUTER;
        break;
      case 'GROQ':
        providerType = AIProviderType.GROQ;
        break;
      case 'DEEPSEEK':
        providerType = AIProviderType.DEEPSEEK;
        break;
      case 'SILICONFLOW':
        providerType = AIProviderType.SILICONFLOW;
        break;
      case 'GOOGLE':
        providerType = AIProviderType.GOOGLE;
        break;
      case 'CUSTOM_OPENAI_COMPATIBLE':
        providerType = AIProviderType.CUSTOM_OPENAI_COMPATIBLE;
        break;
      default:
        providerType = AIProviderType.CUSTOM_OPENAI_COMPATIBLE;
    }

    // 解析可用模型列表
    let availableModels: AIModelInfo[] = [];
    try {
      availableModels = JSON.parse(record.availableModels || '[]');
    } catch {
      availableModels = [];
    }

    return {
      uuid: record.uuid,
      accountUuid: record.accountUuid,
      name: record.name,
      providerType,
      baseUrl: record.baseUrl,
      apiKey: this.decryptApiKey(record.apiKeyEncrypted),
      defaultModel: record.defaultModel,
      availableModels,
      isActive: record.isActive,
      isDefault: record.isDefault,
      priority: record.priority ?? 100,
      createdAt: record.createdAt.getTime(),
      updatedAt: record.updatedAt.getTime(),
    };
  }
}


