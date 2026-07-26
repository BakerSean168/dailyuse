/**
 * Prisma GoalFolder Mapper
 *
 * Maps between GoalFolder domain aggregate and Prisma model.
 */

import type { GoalFolder as PrismaGoalFolder } from '@dailyuse/database';
import { GoalFolder } from '../../../../domain';
import { IdentityId } from '@dailyuse/domain-shared';
import { GoalFolderId } from '../../../../domain';
import type { FolderType } from '@dailyuse/contracts/goal';

/** Prisma Date/DateTime → Instant (epoch ms). Required fields never null. */
function requiredInstant(value: Date | string | number | null | undefined): number {
  if (value instanceof Date) return value.getTime();
  if (value == null) return Date.now();
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : Date.now();
}

/** Prisma Date/DateTime → Instant | null. */
function optionalInstant(value: Date | string | number | null | undefined): number | null {
  if (value == null) return null;
  if (value instanceof Date) return value.getTime();
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}


export class PrismaGoalFolderMapper {
  /** Maps a Prisma row to a Domain GoalFolder aggregate. */
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
      createdAt: requiredInstant(data.createdAt),
      updatedAt: requiredInstant(data.updatedAt),
      deletedAt: optionalInstant(data.deletedAt),
      version: data.version ?? 1,
    });
  }

  /** Batch converts Prisma GoalFolder rows to Domain aggregates. */
  static toDomainList(rows: PrismaGoalFolder[]): GoalFolder[] {
    return rows.map((row) => PrismaGoalFolderMapper.toDomain(row));
  }
}
