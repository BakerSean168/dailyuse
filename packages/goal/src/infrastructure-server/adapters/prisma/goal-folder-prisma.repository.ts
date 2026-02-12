import type { PrismaClient, goalFolder as PrismaGoalFolder } from '@dailyuse/database';
import type { IGoalFolderRepository } from '@/domain-server';
import { GoalFolder } from '@/domain-server';
import { GoalStatus, FolderType } from '@dailyuse/contracts/goal';
import { PriorityLevel } from '@dailyuse/contracts/shared';
import type { GoalServerDTO, GoalClientDTO, KeyResultServerDTO, CreateGoalRequest, UpdateGoalRequest } from '@dailyuse/contracts/goal';

// 绫诲瀷鍒悕

/**
 * GoalFolder Prisma Repository瀹炵幇
 */
export class GoalFolderPrismaRepository implements IGoalFolderRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 灏?Prisma 妯″瀷鏄犲皠涓洪鍩熷疄浣?
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
   * Save鏂囦欢澶?
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
   * 鏍规嵁 UUID 鏌ユ壘鏂囦欢澶?
   */
  async findById(uuid: string): Promise<GoalFolder | null> {
    const data = await this.prisma.goalFolder.findUnique({
      where: { uuid },
    });

    return data ? this.mapToEntity(data) : null;
  }

  /**
   * 鏍规嵁璐︽埛 UUID 鏌ユ壘All鏈夋枃浠跺す
   */
  async findByAccountUuid(accountUuid: string): Promise<GoalFolder[]> {
    const data = await this.prisma.goalFolder.findMany({
      where: { accountUuid },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return data.map((item) => this.mapToEntity(item));
  }

  /**
   * Delete鏂囦欢澶癸紙鐗╃悊Delete锛?
   */
  async delete(uuid: string): Promise<void> {
    await this.prisma.goalFolder.delete({
      where: { uuid },
    });
  }

  /**
   * 妫€鏌ユ枃浠跺す鏄惁瀛樺湪
   */
  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.goalFolder.count({
      where: { uuid },
    });

    return count > 0;
  }
}

