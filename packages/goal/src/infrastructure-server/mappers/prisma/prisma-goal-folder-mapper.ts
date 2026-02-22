/**
 * Prisma GoalFolder Mapper
 *
 * Maps between GoalFolder domain aggregate and Prisma model.
 */

import type { GoalFolder as PrismaGoalFolder } from '@dailyuse/database';
import type { GoalFolderPersistenceDTO } from '@dailyuse/contracts/goal';
import { GoalFolder } from '@/domain-server';

export class PrismaGoalFolderMapper {
  /**
   * Prisma row → Domain GoalFolder aggregate
   */
  static toDomain(data: PrismaGoalFolder): GoalFolder {
    const dto: GoalFolderPersistenceDTO = {
      id: data.id,
      identityId: data.identityId,
      name: data.name,
      description: data.description ?? null,
      icon: data.icon ?? null,
      color: data.color ?? null,
      parentFolderId: data.parentFolderId ?? null,
      sortOrder: data.sortOrder ?? 0,
      folderType: (data.folderType as GoalFolderPersistenceDTO['folderType']) ?? null,
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
   * Batch conversion: Prisma → Domain
   */
  static toDomainList(rows: PrismaGoalFolder[]): GoalFolder[] {
    return rows.map((row) => PrismaGoalFolderMapper.toDomain(row));
  }
}
