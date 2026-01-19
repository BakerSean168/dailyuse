import type { PrismaClient, goalFolder as PrismaGoalFolder } from '@prisma/client';
import type { IGoalFolderRepository } from '@dailyuse/domain-server/goal';
import { GoalFolder } from '@dailyuse/domain-server/goal';
import { GoalStatus, FolderType } from '@dailyuse/contracts/goal';
import { PriorityLevel } from '@dailyuse/contracts/shared';
import type { GoalServerDTO, GoalClientDTO, KeyResultServerDTO, CreateGoalRequest, UpdateGoalRequest } from '@dailyuse/contracts/goal';

// 类型别名

/**
 * GoalFolder Prisma 仓储实现
 */
export class PrismaGoalFolderRepository implements IGoalFolderRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 将 Prisma 模型映射为领域实体
   */
  private mapToEntity(data: PrismaGoalFolder): GoalFolder {
    return GoalFolder.fromPersistenceDTO({
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
      parentFolderUuid: data.parentFolderUuid,
      sortOrder: data.sortOrder,
      isSystemFolder: data.isSystemFolder,
      folderType: data.folderType as FolderType | null,
      goalCount: data.goalCount,
      completedGoalCount: data.completedGoalCount,
      createdAt: data.createdAt.getTime(),
      updatedAt: data.updatedAt.getTime(),
      deletedAt: data.deletedAt ? data.deletedAt.getTime() : null,
    });
  }

  /**
   * 保存文件夹
   */
  async save(folder: GoalFolder): Promise<void> {
    const persistence = folder.toPersistenceDTO();

    await this.prisma.goalFolder.upsert({
      where: { uuid: folder.uuid },
      create: {
        uuid: persistence.uuid,
        accountUuid: persistence.accountUuid,
        name: persistence.name,
        description: persistence.description,
        icon: persistence.icon,
        color: persistence.color,
        parentFolderUuid: persistence.parentFolderUuid,
        sortOrder: persistence.sortOrder,
        isSystemFolder: persistence.isSystemFolder,
        folderType: persistence.folderType,
        goalCount: persistence.goalCount,
        completedGoalCount: persistence.completedGoalCount,
        createdAt: new Date(persistence.createdAt),
        updatedAt: new Date(persistence.updatedAt),
        deletedAt: persistence.deletedAt ? new Date(persistence.deletedAt) : null,
      },
      update: {
        name: persistence.name,
        description: persistence.description,
        icon: persistence.icon,
        color: persistence.color,
        parentFolderUuid: persistence.parentFolderUuid,
        sortOrder: persistence.sortOrder,
        goalCount: persistence.goalCount,
        completedGoalCount: persistence.completedGoalCount,
        updatedAt: new Date(persistence.updatedAt),
        deletedAt: persistence.deletedAt ? new Date(persistence.deletedAt) : null,
      },
    });
  }

  /**
   * 根据 UUID 查找文件夹
   */
  async findById(uuid: string): Promise<GoalFolder | null> {
    const data = await this.prisma.goalFolder.findUnique({
      where: { uuid },
    });

    return data ? this.mapToEntity(data) : null;
  }

  /**
   * 根据账户 UUID 查找所有文件夹
   */
  async findByAccountUuid(accountUuid: string): Promise<GoalFolder[]> {
    const data = await this.prisma.goalFolder.findMany({
      where: { accountUuid },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return data.map((item) => this.mapToEntity(item));
  }

  /**
   * 删除文件夹（物理删除）
   */
  async delete(uuid: string): Promise<void> {
    await this.prisma.goalFolder.delete({
      where: { uuid },
    });
  }

  /**
   * 检查文件夹是否存在
   */
  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.goalFolder.count({
      where: { uuid },
    });

    return count > 0;
  }
}

