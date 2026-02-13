/**
 * TaskFolderPrismaRepository - Prisma Implementation of ITaskFolderRepository
 * 任务文件夹仓储 - Prisma实现
 */

import type { PrismaClient } from '@dailyuse/database';
import type { ITaskFolderRepository } from '../../../domain-server/repositories/ITaskFolderRepository';
import type { TaskFolderServerDTO } from '@dailyuse/contracts/task';

export class TaskFolderPrismaRepository implements ITaskFolderRepository {
  constructor(private prisma: PrismaClient) {}

  private mapToDTO(data: any): TaskFolderServerDTO {
    return {
      id: data.id,
      identityId: data.identityId,
      name: data.name,
      color: data.color ?? null,
      icon: data.icon ?? null,
      order: data.order,
      version: data.version,
      createdAt: data.createdAt instanceof Date ? data.createdAt.toISOString() : data.createdAt,
      updatedAt: data.updatedAt instanceof Date ? data.updatedAt.toISOString() : data.updatedAt,
      deletedAt: data.deletedAt ? (data.deletedAt instanceof Date ? data.deletedAt.toISOString() : data.deletedAt) : null,
    };
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

  async findByUuid(uuid: string): Promise<TaskFolderServerDTO | null> {
    const data = await this.prisma.taskFolder.findUnique({
      where: { id: uuid },
    });
    return data ? this.mapToDTO(data) : null;
  }

  async findByAccount(accountUuid: string): Promise<TaskFolderServerDTO[]> {
    const data = await this.prisma.taskFolder.findMany({
      where: { identityId: accountUuid, deletedAt: null },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return data.map((item: any) => this.mapToDTO(item));
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.taskFolder.delete({
      where: { id: uuid },
    });
  }

  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.taskFolder.count({
      where: { id: uuid },
    });
    return count > 0;
  }
}
