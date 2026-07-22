/**
 * TaskFolderPrismaRepository - Prisma Implementation of ITaskFolderRepository
 * 任务文件夹仓储 - Prisma 实现
 *
 * 聚合根：TaskFolder
 */

import type { PrismaClient, TaskFolder as PrismaTaskFolder } from '@dailyuse/database';
import type { ITaskFolderRepository } from '../../../domain/repositories/i-task-folder-repository';
import type { TaskFolderServerDTO } from '@dailyuse/contracts/task';
import { PrismaTaskFolderMapper } from './mappers/prisma-task-folder-mapper';

export class TaskFolderPrismaRepository implements ITaskFolderRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Prisma record  TaskFolderServerDTO
   */
  private mapToDTO(data: PrismaTaskFolder): TaskFolderServerDTO {
    return PrismaTaskFolderMapper.toDTO(data);
  }

  async save(folder: TaskFolderServerDTO): Promise<void> {
    await this.prisma.taskFolder.upsert({
      where: { id: folder.id },
      create: {
        id: folder.id,
        identityId: folder.identityId,
        name: folder.name,
        color: folder.color,
        icon: folder.icon,
        order: folder.order,
        version: folder.version,
      },
      update: {
        name: folder.name,
        color: folder.color,
        icon: folder.icon,
        order: folder.order,
        version: folder.version,
      },
    });
  }

  async findById(id: string): Promise<TaskFolderServerDTO | null> {
    const data = await this.prisma.taskFolder.findUnique({
      where: { id },
    });
    return data ? this.mapToDTO(data) : null;
  }

  async findByIdForIdentity(identityId: string, id: string): Promise<TaskFolderServerDTO | null> {
    const data = await this.prisma.taskFolder.findFirst({
      where: { id, identityId },
    });
    return data ? this.mapToDTO(data) : null;
  }

  async findByIdentityId(identityId: string): Promise<TaskFolderServerDTO[]> {
    const data = await this.prisma.taskFolder.findMany({
      where: { identityId, deletedAt: null },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return data.map((item: PrismaTaskFolder) => this.mapToDTO(item));
  }

  async delete(identityId: string, id: string): Promise<void> {
    const result = await this.prisma.taskFolder.deleteMany({
      where: { id, identityId },
    });
    if (result.count === 0) {
      throw new Error('Task folder not found for the current identity.');
    }
  }

  async exists(identityId: string, id: string): Promise<boolean> {
    const count = await this.prisma.taskFolder.count({
      where: { id, identityId },
    });
    return count > 0;
  }
}
