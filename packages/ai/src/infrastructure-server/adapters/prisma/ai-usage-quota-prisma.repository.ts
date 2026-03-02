/**
 * AIUsageQuota Prisma Repository
 *
 * Prisma implementation of IAIUsageQuotaRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { PrismaClient, AiUsageQuota as PrismaAiUsageQuota } from '@dailyuse/database';
import type { IAIUsageQuotaRepository } from '../../../domain-server';
import type { AIUsageQuotaServerDTO } from '@dailyuse/contracts/ai';
import { QuotaResetPeriod } from '@dailyuse/contracts/ai';

/**
 * AIUsageQuota Prisma Repository
 *
 * Prisma implementation of IAIUsageQuotaRepository.
 */
export class AIUsageQuotaPrismaRepository implements IAIUsageQuotaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(quota: AIUsageQuotaServerDTO): Promise<void> {
    await this.prisma.aiUsageQuota.upsert({
      where: { id: String(quota.id) },
      create: {
        id: String(quota.id),
        identityId: String(quota.identityId),
        quotaLimit: quota.quotaLimit,
        currentUsage: quota.currentUsage,
        resetPeriod: quota.resetPeriod,
        lastResetAt: new Date(quota.lastResetAt),
        nextResetAt: new Date(quota.nextResetAt),
        createdAt: new Date(quota.createdAt),
        updatedAt: new Date(quota.updatedAt),
        deletedAt: null,
      },
      update: {
        quotaLimit: quota.quotaLimit,
        currentUsage: quota.currentUsage,
        resetPeriod: quota.resetPeriod,
        lastResetAt: new Date(quota.lastResetAt),
        nextResetAt: new Date(quota.nextResetAt),
        updatedAt: new Date(quota.updatedAt),
      },
    });
  }

  async findById(id: string): Promise<AIUsageQuotaServerDTO | null> {
    const row = await this.prisma.aiUsageQuota.findFirst({
      where: { id, deletedAt: null },
    });

    return row ? this.toServerDTO(row) : null;
  }

  async findByIdentityId(identityId: string): Promise<AIUsageQuotaServerDTO | null> {
    const row = await this.prisma.aiUsageQuota.findFirst({
      where: { identityId, deletedAt: null },
    });

    return row ? this.toServerDTO(row) : null;
  }

  async createDefaultQuota(identityId: string): Promise<AIUsageQuotaServerDTO> {
    const now = new Date();
    const nextResetAt = new Date(now);
    nextResetAt.setDate(nextResetAt.getDate() + 1);
    nextResetAt.setHours(0, 0, 0, 0);

    const row = await this.prisma.aiUsageQuota.create({
      data: {
        id: crypto.randomUUID(),
        identityId,
        quotaLimit: 50,
        currentUsage: 0,
        resetPeriod: QuotaResetPeriod.Daily,
        lastResetAt: now,
        nextResetAt,
      },
    });

    return this.toServerDTO(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.aiUsageQuota.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async exists(identityId: string): Promise<boolean> {
    const count = await this.prisma.aiUsageQuota.count({
      where: { identityId, deletedAt: null },
    });

    return count > 0;
  }

  private toServerDTO(row: PrismaAiUsageQuota): AIUsageQuotaServerDTO {
    return {
      id: row.id as AIUsageQuotaServerDTO['id'],
      identityId: row.identityId as AIUsageQuotaServerDTO['identityId'],
      quotaLimit: row.quotaLimit,
      currentUsage: row.currentUsage,
      resetPeriod: row.resetPeriod as QuotaResetPeriod,
      lastResetAt: new Date(row.lastResetAt).getTime(),
      nextResetAt: new Date(row.nextResetAt).getTime(),
      createdAt: new Date(row.createdAt).getTime(),
      updatedAt: new Date(row.updatedAt).getTime(),
    };
  }
}
