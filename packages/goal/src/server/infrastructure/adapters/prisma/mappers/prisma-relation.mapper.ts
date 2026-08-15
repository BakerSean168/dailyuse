import type { Relation as PrismaRelation } from '@memoflow/database';
import type { RelationDTO, RelationType, SubjectType } from '../../../../domain';

/**
 * Prisma Relation 行 → RelationDTO 映射器 / Prisma Relation row → RelationDTO mapper.
 *
 * 将持久化的字符串枚举转换为冻结的 `SubjectType`/`RelationType` 联合类型，
 * 并把 `createdAt` 从 Date 转为毫秒时间戳（number）。
 * Converts the persisted string enums into the frozen `SubjectType`/`RelationType`
 * unions and normalizes `createdAt` from Date into an epoch-millisecond number.
 */
export class PrismaRelationMapper {
  /** 单行转换 / Maps a single Prisma row to RelationDTO. */
  static toDTO(row: PrismaRelation): RelationDTO {
    return {
      id: row.id,
      subject: { type: row.subjectType as SubjectType, id: row.subjectId },
      relationType: row.relationType as RelationType,
      object: { type: row.objectType as SubjectType, id: row.objectId },
      createdAt: row.createdAt.getTime(),
    };
  }

  /** 批量转换 / Maps Prisma rows to RelationDTO[]. */
  static toDTOList(rows: PrismaRelation[]): RelationDTO[] {
    return rows.map((row) => PrismaRelationMapper.toDTO(row));
  }
}
