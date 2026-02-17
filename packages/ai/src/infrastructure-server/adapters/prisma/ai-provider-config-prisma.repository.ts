/**
 * AIProviderConfig Prisma Repository
 *
 * Prisma implementation of IAIProviderConfigRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { IAIProviderConfigRepository } from '../../../domain-server';
import type { AIProviderConfigServerDTO } from '@dailyuse/contracts/ai';

/**
 * AIProviderConfig Prisma Repository
 *
 * Skeleton implementation - to be completed when extracting from apps/api.
 */
export class AIProviderConfigPrismaRepository implements IAIProviderConfigRepository {
  constructor(private readonly prisma: any) {}

  async save(config: AIProviderConfigServerDTO): Promise<void> {
    await this.prisma.aiProviderConfig.upsert({
      where: { id: String(config.id) },
      create: {
        id: String(config.id),
        identityId: String(config.identityId),
        name: config.name,
        providerType: config.providerType,
        baseUrl: config.baseUrl,
        apiKeyEncrypted: config.apiKey,
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
        apiKeyEncrypted: config.apiKey,
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

    return rows.map((row: any) => this.toServerDTO(row));
  }

  async findDefaultByIdentityId(identityId: string): Promise<AIProviderConfigServerDTO | null> {
    const row = await this.prisma.aiProviderConfig.findFirst({
      where: { identityId, isDefault: true, isActive: true, deletedAt: null },
    });

    return row ? this.toServerDTO(row) : null;
  }

  async findByIdentityIdAndName(identityId: string, name: string): Promise<AIProviderConfigServerDTO | null> {
    const row = await this.prisma.aiProviderConfig.findFirst({
      where: { identityId, name, deletedAt: null },
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

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.aiProviderConfig.count({
      where: { id, deletedAt: null },
    });

    return count > 0;
  }

  async clearDefaultForIdentity(identityId: string): Promise<void> {
    await this.prisma.aiProviderConfig.updateMany({
      where: { identityId, deletedAt: null },
      data: { isDefault: false },
    });
  }

  private toServerDTO(row: any): AIProviderConfigServerDTO {
    return {
      id: row.id,
      identityId: row.identityId,
      name: row.name,
      providerType: row.providerType,
      baseUrl: row.baseUrl,
      apiKey: row.apiKeyEncrypted,
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

  private parseModels(value: string | null): any[] {
    if (!value) {
      return [];
    }

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
