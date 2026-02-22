/**
 * Prisma GoalFolder Mapper
 *
 * Maps between GoalFolder domain aggregate and Prisma model.
 */

import type { GoalFolder as PrismaGoalFolder } from '@dailyuse/database';
import { GoalFolder } from '@/domain-server';
import { IdentityId } from '@dailyuse/domain-shared';
import { GoalFolderId } from '@/domain-shared';
import type { FolderType } from '@dailyuse/contracts/goal';

export class PrismaGoalFolderMapper {
  /**
   * Prisma row → Domain GoalFolder aggregate
   */
  static toDomain(data: PrismaGoalFolder): GoalFolder {
    return GoalFolder.load({
      id: GoalFolderId.of(data.id),
      identityId: IdentityId.of(data.identityId),
      name: data.name,
      description: data.description ?? null,
      icon: data.icon ?? null,
      color: data.color ?? null,
      parentFolderId: data.parentFolderId ? GoalFolderId.of(data.parentFolderId) : null,
      sortOrder: data.sortOrder ?? 0,
      folderType: (data.folderType as FolderType) ?? null,
      isSystemFolder: false,
      goalCount: data.goalCount ?? 0,
      completedGoalCount: data.completedGoalCount ?? 0,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? null,
      version: data.version ?? 1,
    });
  }

  /**
   * Batch conversion: Prisma → Domain
   */
  static toDomainList(rows: PrismaGoalFolder[]): GoalFolder[] {
    return rows.map((row) => PrismaGoalFolderMapper.toDomain(row));
  }
}
