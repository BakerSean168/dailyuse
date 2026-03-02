/**
 * Prisma TaskFolder Mapper
 *
 * Maps between TaskFolder and Prisma model.
 * Returns TaskFolderServerDTO directly (no domain entity wrapper).
 */

import type { TaskFolder as PrismaTaskFolder } from '@dailyuse/database';
import type { TaskFolderServerDTO } from '@dailyuse/contracts/task';

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
      createdAt: data.createdAt instanceof Date ? data.createdAt.getTime() : data.createdAt,
      updatedAt: data.updatedAt instanceof Date ? data.updatedAt.getTime() : data.updatedAt,
      deletedAt: data.deletedAt
        ? data.deletedAt instanceof Date
          ? data.deletedAt.getTime()
          : data.deletedAt
        : null,
    };
  }

  /**
   * Batch conversion: Prisma → DTO
   */
  static toDTOList(rows: PrismaTaskFolder[]): TaskFolderServerDTO[] {
    return rows.map((row) => PrismaTaskFolderMapper.toDTO(row));
  }
}
