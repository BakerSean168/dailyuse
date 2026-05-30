/**
 * RuleRevisionPrismaMapper — Bidirectional mapping between Prisma RuleRevision rows and domain entity.
 * RuleRevisionPrismaMapper —— Prisma RuleRevision 行数据与领域实体之间的双向映射。
 *
 * Responsibilities:
 * 职责：
 * - toDomain: PrismaRuleRevision → RuleRevision entity (defensive JSON parsing)
 *   toDomain: PrismaRuleRevision → RuleRevision 实体（防御性 JSON 解析）
 * - toPersistence: RuleRevision → Prisma write format (serialize arrays/objects to JSON strings)
 *   toPersistence: RuleRevision → Prisma 写入格式（将数组/对象序列化为 JSON 字符串）
 * - JSON field parsing: changedFields (string[]), previousValues/newValues (Record)
 *   JSON 字段解析：changedFields (string[])、previousValues/newValues (Record)
 *
 * SQLite compatibility notes:
 * SQLite 兼容性说明：
 * - changedFields / previousValues / newValues stored as TEXT (JSON string)
 *   changedFields / previousValues / newValues 存储为 TEXT（JSON 字符串）
 * - Defensive parsing via parseStringArray / parseRecord with fallback defaults
 *   通过 parseStringArray / parseRecord 防御性解析，带回退默认值
 * - RuleRevision is immutable audit record: only create, no updatedAt
 *   RuleRevision 是不可变审计记录：仅支持 create，无 updatedAt 字段
 *
 * @internal Persistence mapper — not part of the public API.
 * @internal 持久化映射器 — 非公开 API。
 */

import type { RuleRevision as PrismaRuleRevision } from '@dailyuse/database';
import type { IdentityId } from '@dailyuse/contracts/primitives';
import { RuleRevision } from '../../../../domain-server/entities/rule-revision';
import { RuleId } from '../../../../domain-shared/value-objects/rule-id';
import { RuleRevisionId } from '../../../../domain-shared/value-objects/rule-revision-id';
import { fromDbDate, parseStringArray, parseRecord } from '../../mapper-helpers';

// ---------------------------------------------------------------------------
// ChangeType — imported from domain-shared value object
// ---------------------------------------------------------------------------
import type { ChangeType } from '../../../../domain-shared/value-objects/change-type';

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

/** Converts between Prisma RuleRevision rows and domain RuleRevision entities. */
export class RuleRevisionPrismaMapper {
  /**
   * Converts a Prisma row to a domain RuleRevision entity.
   * 将 Prisma 行数据转换为领域 RuleRevision 实体。
   *
   * Defensively parses JSON fields with fallback defaults.
   * 对 JSON 字段进行防御性解析，带回退默认值。
   *
   * @param raw - Prisma RuleRevision row from database 从数据库获取的 Prisma RuleRevision 行数据
   * @returns Hydrated RuleRevision domain entity 水合后的 RuleRevision 领域实体
   */
  static toDomain(raw: PrismaRuleRevision): RuleRevision {
    return RuleRevision.load({
      id: raw.id as RuleRevisionId,
      ruleId: raw.ruleId as RuleId,
      revisionNumber: raw.revisionNumber,
      authorId: raw.authorId as IdentityId,
      changedFields: parseStringArray(raw.changedFields),
      previousValues: parseRecord(raw.previousValues),
      newValues: parseRecord(raw.newValues),
      changeType: raw.changeType as ChangeType,
      createdAt: fromDbDate(raw.createdAt),
    });
  }

  /**
   * Converts a domain RuleRevision entity to Prisma write format.
   * 将领域 RuleRevision 实体转换为 Prisma 写入格式。
   *
   * RuleRevision is an immutable audit record: only create, no updatedAt.
   * RuleRevision 是不可变审计记录：仅支持 create，无 updatedAt。
   *
   * @param revision - Domain RuleRevision entity 领域 RuleRevision 实体
   * @returns Object suitable for Prisma create operations
   *          适用于 Prisma create 操作的对象
   */
  static toPersistence(revision: RuleRevision): Omit<PrismaRuleRevision, never> {
    return {
      id: revision.id,
      ruleId: revision.ruleId,
      revisionNumber: revision.revisionNumber,
      authorId: revision.authorId,
      changedFields: JSON.stringify([...revision.changedFields]),
      previousValues: JSON.stringify(revision.previousValues),
      newValues: JSON.stringify(revision.newValues),
      changeType: revision.changeType,
      createdAt: fromDbDate(revision.createdAt),
    };
  }

  /** Batch converts multiple rows to domain entities. 批量将多行数据转换为领域实体。 */
  static toDomainMany(raws: PrismaRuleRevision[]): RuleRevision[] {
    return raws.map((raw) => RuleRevisionPrismaMapper.toDomain(raw));
  }
}
