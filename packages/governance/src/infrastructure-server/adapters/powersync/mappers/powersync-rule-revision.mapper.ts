/**
 * PowerSync RuleRevision Mapper - Persistence ↔ Domain Translation
 * PowerSync 规则修订版本映射器 - 持久化 ↔ 领域转换
 *
 * Translates between PowerSync SQLite rows and domain RuleRevision entities.
 * 在 PowerSync SQLite 行数据与领域 RuleRevision 实体之间进行转换。
 *
 * Handles:
 * 处理：
 * - JSON serialization for changed_fields, previous_values, new_values
 *   changed_fields、previous_values、new_values 的 JSON 序列化
 * - Defensive parsing with fallback defaults for malformed data
 *   对格式错误数据的防御性解析（带回退默认值）
 */
import { RuleRevision } from '../../../../domain-server/entities/rule-revision';
import { RuleId } from '../../../../domain-shared/value-objects/rule-id';
import { RuleRevisionId } from '../../../../domain-shared/value-objects/rule-revision-id';
import type { IdentityId } from '@dailyuse/contracts/primitives';

type ChangeType = 'Created' | 'Updated' | 'Deprecated' | 'Reactivated';

/**
 * Represents a row in the PowerSync `rule_revisions` table.
 * 表示 PowerSync `rule_revisions` 表中的一行数据。
 *
 * JSON fields: changed_fields (string[]), previous_values, new_values (Record).
 * JSON 字段：changed_fields (string[])、previous_values、new_values (Record)。
 *
 * @internal Persistence row format — not part of the public API.
 * @internal 持久化行格式 — 非公开 API。
 */
export interface PowerSyncRuleRevisionRow {
  id: string;
  rule_id: string;
  revision_number: number;
  author_id: string;
  changed_fields: string;
  previous_values: string | null;
  new_values: string | null;
  change_type: string;
  created_at: string;
}

/** Write row type (currently identical to read row). 写入行类型（当前与读取行类型相同）。 @internal */
export interface PowerSyncRuleRevisionWriteRow extends PowerSyncRuleRevisionRow {}

/**
 * Safely parses a JSON string as a string array, returning [] on failure.
 * 安全地将 JSON 字符串解析为字符串数组，失败时返回空数组。
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
 * Safely parses a JSON string as an object record, returning {} on failure.
 * 安全地将 JSON 字符串解析为对象记录，失败时返回空对象。
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

/**
 * Safely parses a date string, falling back to current date on failure.
 * 安全解析日期字符串，解析失败时回退到当前日期。
 */
function toDate(value: string | null | undefined): Date {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Mapper for converting between PowerSync rows and domain RuleRevision entities.
 * 用于 PowerSync 行数据与领域 RuleRevision 实体之间转换的映射器。
 *
 * @internal Persistence mapper — not part of the public API.
 * @internal 持久化映射器 — 非公开 API。
 */
export class PowerSyncRuleRevisionMapper {
  /**
   * Converts a PowerSync row to a domain RuleRevision entity.
   * 将 PowerSync 行数据转换为领域 RuleRevision 实体。
   *
   * Defensively parses JSON fields with fallback defaults.
   * 对 JSON 字段进行防御性解析，带回退默认值。
   *
   * @param row - Raw SQLite row data 原始 SQLite 行数据
   * @returns Hydrated RuleRevision domain entity 水合后的 RuleRevision 领域实体
   */
  static toDomain(row: PowerSyncRuleRevisionRow): RuleRevision {
    return RuleRevision.load({
      id: row.id as RuleRevisionId,
      ruleId: row.rule_id as RuleId,
      revisionNumber: row.revision_number,
      authorId: row.author_id as IdentityId,
      changedFields: parseStringArray(row.changed_fields),
      previousValues: parseRecord(row.previous_values),
      newValues: parseRecord(row.new_values),
      changeType: row.change_type as ChangeType,
      createdAt: toDate(row.created_at),
    });
  }

  /**
   * Converts a domain RuleRevision entity to a PowerSync persistence row.
   * 将领域 RuleRevision 实体转换为 PowerSync 持久化行数据。
   *
   * Serializes arrays/objects to JSON strings for SQLite storage.
   * 将数组/对象序列化为 JSON 字符串以存储到 SQLite。
   *
   * @param revision - Domain RuleRevision entity 领域 RuleRevision 实体
   * @returns Flat row suitable for SQLite INSERT 适用于 SQLite INSERT 的扁平行数据
   */
  static toPersistence(revision: RuleRevision): PowerSyncRuleRevisionWriteRow {
    return {
      id: revision.id,
      rule_id: revision.ruleId,
      revision_number: revision.revisionNumber,
      author_id: revision.authorId,
      changed_fields: JSON.stringify([...revision.changedFields]),
      previous_values: JSON.stringify(revision.previousValues),
      new_values: JSON.stringify(revision.newValues),
      change_type: revision.changeType,
      created_at: revision.createdAt.toISOString(),
    };
  }

  /** Batch converts multiple rows to domain entities. 批量将多行数据转换为领域实体。 */
  static toDomainMany(rows: PowerSyncRuleRevisionRow[]): RuleRevision[] {
    return rows.map((row) => PowerSyncRuleRevisionMapper.toDomain(row));
  }
}
