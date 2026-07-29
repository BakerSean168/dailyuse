/**
 * Prisma TaskFolder Mapper
 *
 * Maps between TaskFolder and Prisma model.
 * Returns TaskFolderServerDTO directly (no domain entity wrapper).
 */

import type { TaskFolder as PrismaTaskFolder } from '@memoflow/database';
import type { TaskFolderServerDTO } from '@memoflow/contracts/task';

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


export class PrismaTaskFolderMapper {
  /**
   * Prisma record → TaskFolderServerDTO
   */
  static toDTO(data: PrismaTaskFolder): TaskFolderServerDTO {
    return {
      id: data.id as TaskFolderServerDTO['id'],
      identityId: data.identityId as TaskFolderServerDTO['identityId'],
      name: data.name,
      color: data.color ?? null,
      icon: data.icon ?? null,
      order: data.order,
      version: data.version,
      createdAt: requiredInstant(data.createdAt),
      updatedAt: requiredInstant(data.updatedAt),
      deletedAt: optionalInstant(data.deletedAt),
    };
  }

  /**
   * Batch conversion: Prisma → DTO
   */
  static toDTOList(rows: PrismaTaskFolder[]): TaskFolderServerDTO[] {
    return rows.map((row) => PrismaTaskFolderMapper.toDTO(row));
  }
}
