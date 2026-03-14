/**
 * RuleRevisionPrismaMapper — Prisma ↔ Domain 转换
 *
 * 职责：
 * - RuleRevision 分表（ruleRevision）与领域实体之间的双向映射
 * - JSON 字段解析：changedFields、previousValues、newValues
 * - 从 RuleRevision Repository 中提取的内联映射逻辑，集中复用
 *
 * SQLite 兼容：
 * - changedFields / previousValues / newValues 均存为 TEXT（JSON 字符串）
 * - 统一使用 parseStringArray / parseRecord 防御性解析
 * - DateTime 字段通过 fromDbDate 处理 string / Date 两种形式
 *
 * 不负责：
 * - Rule 主表映射（见 rule-prisma.mapper.ts）
 * - 数据库查询逻辑
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

export class RuleRevisionPrismaMapper {
  /**
   * Prisma RuleRevision → Domain RuleRevision 实体
   *
   * 用于从数据库加载修订记录。
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
   * Domain RuleRevision 实体 → Prisma 写入格式
   *
   * RuleRevision 是不可变审计记录，仅支持 create，无 updatedAt。
   *
   * SQLite 注意事项：
   * - changedFields / previousValues / newValues 序列化为 JSON 字符串
   * - Set 类型的 changedFields 需先展开为数组
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

  /** 批量转换（read-side 常用） */
  static toDomainMany(raws: PrismaRuleRevision[]): RuleRevision[] {
    return raws.map((raw) => RuleRevisionPrismaMapper.toDomain(raw));
  }
}
