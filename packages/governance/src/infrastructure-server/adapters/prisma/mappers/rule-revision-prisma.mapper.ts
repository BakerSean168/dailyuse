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

// ---------------------------------------------------------------------------
// SQLite 兼容帮助函数
// ---------------------------------------------------------------------------

/**
 * 从数据库字段安全还原 Date。
 * SQLite Prisma 返回的 DateTime 通常已是 JS Date，
 * 但 seed 数据或手动插入的 ISO 字符串需统一处理。
 */
function fromDbDate(value: Date | string): Date {
  if (value instanceof Date) return value;
  const d = new Date(value);
  if (isNaN(d.getTime())) throw new Error(`Invalid date from DB: ${String(value)}`);
  return d;
}

/**
 * 反序列化 SQLite TEXT 列存储的 JSON 字符串数组。
 * 防御 null / 非数组 / 损坏数据。
 */
function parseStringArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

/**
 * 反序列化 SQLite TEXT 列存储的 JSON 对象。
 * 防御 null / 非对象 / 损坏数据。
 */
function parseRecord(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// ChangeType 合法值（与 Prisma schema 中枚举保持同步）
// ---------------------------------------------------------------------------
type ChangeType = 'Created' | 'Updated' | 'Deprecated' | 'Reactivated';

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
  static toPersistence(
    revision: RuleRevision
  ): Omit<PrismaRuleRevision, never> {
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
    return raws.map(raw => RuleRevisionPrismaMapper.toDomain(raw));
  }
}
