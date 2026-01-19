/**
 * Knowledge Generation Task Repository Implementation (Story 4.3)
 * Prisma 实现的知识系列生成任务仓储
 */

import type { PrismaClient } from '@prisma/client';
import type {
  IKnowledgeGenerationTaskRepository,
  KnowledgeGenerationTask,
} from '@dailyuse/domain-server/ai';

export class KnowledgeGenerationTaskRepository implements IKnowledgeGenerationTaskRepository {
  constructor(private prisma: PrismaClient) {}

  async create(task: KnowledgeGenerationTask): Promise<KnowledgeGenerationTask> {
    const record = await this.prisma.knowledgeGenerationTask.create({
      data: {
        uuid: task.uuid,
        accountUuid: task.accountUuid,
        topic: task.topic,
        documentCount: task.documentCount,
        targetAudience: task.targetAudience,
        folderPath: task.folderPath,
        status: task.status,
        progress: task.progress,
        generatedDocumentUuids: task.generatedDocumentUuids,
        error: task.error,
        createdAt: new Date(task.createdAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : null,
      },
    });
    return this.toDomain(record);
  }

  async findByUuid(uuid: string): Promise<KnowledgeGenerationTask | null> {
    const record = await this.prisma.knowledgeGenerationTask.findUnique({
      where: { uuid },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByAccountUuid(accountUuid: string): Promise<KnowledgeGenerationTask[]> {
    const records = await this.prisma.knowledgeGenerationTask.findMany({
      where: { accountUuid },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async update(task: KnowledgeGenerationTask): Promise<KnowledgeGenerationTask> {
    const record = await this.prisma.knowledgeGenerationTask.update({
      where: { uuid: task.uuid },
      data: {
        status: task.status,
        progress: task.progress,
        generatedDocumentUuids: task.generatedDocumentUuids,
        error: task.error,
        completedAt: task.completedAt ? new Date(task.completedAt) : null,
      },
    });
    return this.toDomain(record);
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.knowledgeGenerationTask.delete({
      where: { uuid },
    });
  }

  private toDomain(record: any): KnowledgeGenerationTask {
    return {
      uuid: record.uuid,
      accountUuid: record.accountUuid,
      topic: record.topic,
      documentCount: record.documentCount,
      targetAudience: record.targetAudience || undefined,
      folderPath: record.folderPath,
      status: record.status as any,
      progress: record.progress,
      generatedDocumentUuids: record.generatedDocumentUuids,
      error: record.error || undefined,
      createdAt: record.createdAt.getTime(),
      completedAt: record.completedAt ? record.completedAt.getTime() : undefined,
    };
  }
}
