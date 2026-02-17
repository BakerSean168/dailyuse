import type { PrismaClient } from '@dailyuse/database';
import type { IGoalFolderRepository } from '@/domain-server';
import { GoalFolder } from '@/domain-server';
import type { GoalFolderPersistenceDTO } from '@dailyuse/contracts/goal';
import { AggregateRepositoryBase, type IEventBus } from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils';

/**
 * Global EventBus adapter
 */
const eventBusAdapter: IEventBus = {
  async publish(event) {
    eventBus.send(event.eventType as any, event.payload);
  },
  async send(eventType, payload) {
    eventBus.send(eventType as any, payload);
  },
};

/**
 * GoalFolder Prisma Repository
 *
 * Prisma implementation of IGoalFolderRepository.
 */
export class GoalFolderPrismaRepository
  extends AggregateRepositoryBase<GoalFolder>
  implements IGoalFolderRepository
{
  constructor(private prisma: PrismaClient) {
    super(eventBusAdapter);
  }

  /**
   * Map Prisma row to domain entity
   */
  private mapToEntity(data: any): GoalFolder {
    const dto: GoalFolderPersistenceDTO = {
      id: data.id,
      identityId: data.identityId,
      name: data.name,
      description: data.description ?? null,
      icon: data.icon ?? null,
      color: data.color ?? null,
      parentFolderId: data.parentFolderId ?? null,
      sortOrder: data.sortOrder ?? 0,
      folderType: data.folderType ?? null,
      goalCount: data.goalCount ?? 0,
      completedGoalCount: data.completedGoalCount ?? 0,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? null,
      version: data.version ?? 1,
    };
    return GoalFolder.fromPersistenceDTO(dto);
  }

  /**
   * Protected persistence method - called by base class before event publishing
   */
  protected async persist(folder: GoalFolder): Promise<void> {
    const dto = folder.toPersistenceDTO();

    await (this.prisma as any).goalFolder.upsert({
      where: { id: dto.id as string },
      create: {
        id: dto.id as string,
        identityId: dto.identityId as string,
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        color: dto.color,
        parentFolderId: dto.parentFolderId ? (dto.parentFolderId as string) : null,
        sortOrder: dto.sortOrder,
        folderType: dto.folderType,
        goalCount: dto.goalCount,
        completedGoalCount: dto.completedGoalCount,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
        deletedAt: dto.deletedAt,
        version: dto.version,
      },
      update: {
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        color: dto.color,
        parentFolderId: dto.parentFolderId ? (dto.parentFolderId as string) : null,
        sortOrder: dto.sortOrder,
        goalCount: dto.goalCount,
        completedGoalCount: dto.completedGoalCount,
        updatedAt: dto.updatedAt,
        deletedAt: dto.deletedAt,
        version: dto.version,
      },
    });
  }

  /**
   * Find folder by ID
   */
  async findById(id: string): Promise<GoalFolder | null> {
    const data = await (this.prisma as any).goalFolder.findUnique({
      where: { id },
    });
    return data ? this.mapToEntity(data) : null;
  }

  /**
   * Find all folders by identity ID
   */
  async findByIdentityId(identityId: string): Promise<GoalFolder[]> {
    const data = await (this.prisma as any).goalFolder.findMany({
      where: { identityId, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return data.map((item: any) => this.mapToEntity(item));
  }

  /**
   * Delete folder
   */
  async delete(id: string): Promise<void> {
    await (this.prisma as any).goalFolder.delete({
      where: { id },
    });
  }

  /**
   * Check if folder exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await (this.prisma as any).goalFolder.count({
      where: { id },
    });
    return count > 0;
  }
}