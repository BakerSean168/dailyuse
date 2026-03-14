/**
 * PowerSync Rule Mapper - Persistence ↔ Domain Translation
 * PowerSync 规则映射器 - 持久化 ↔ 领域转换
 *
 * Translates between PowerSync SQLite rows and domain Rule aggregates.
 * 在 PowerSync SQLite 行数据与领域 Rule 聚合根之间进行转换。
 *
 * Handles:
 * 处理：
 * - JSON serialization/deserialization for tags and code snippets
 *   标签和代码片段的 JSON 序列化/反序列化
 * - Date string ↔ Date object conversion
 *   日期字符串 ↔ Date 对象转换
 * - Branded type casting (string → RuleId, RuleSeverity, etc.)
 *   品牌类型转换（string → RuleId, RuleSeverity 等）
 */
import { Rule } from '../../../../domain-server/aggregates/rule';
import { RuleId } from '../../../../domain-shared/value-objects/rule-id';
import { RuleTag } from '../../../../domain-shared/value-objects/rule-tag';
import { CodeSnippet } from '../../../../domain-shared/value-objects/code-snippet';
import type { RuleStatus } from '../../../../domain-shared/value-objects/rule-status';
import type { RuleSeverity } from '../../../../domain-shared/value-objects/rule-severity';
import type { IdentityId } from '@dailyuse/contracts/primitives';
import type { CodeSnippetPersistenceDTO } from '../../../../domain-shared/value-objects/code-snippet';

/**
 * Represents a row in the PowerSync `rules` table.
 * 表示 PowerSync `rules` 表中的一行数据。
 *
 * All fields are stored as strings in SQLite; JSON fields (tags, examples)
 * are serialized as JSON strings.
 * 所有字段在 SQLite 中以字符串存储；JSON 字段（标签、示例）以 JSON 字符串序列化。
 *
 * @internal Persistence row format — not part of the public API.
 * @internal 持久化行格式 — 非公开 API。
 */
export interface PowerSyncRuleRow {
  id: string;
  code: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  deprecation_reason: string | null;
  replacement_rule_id: string | null;
  live_reference_location: string | null;
  tags: string;
  good_examples: string;
  bad_examples: string;
  author_id: string;
  created_at: string;
  updated_at: string;
}

/** Write row type (currently identical to read row). 写入行类型（当前与读取行类型相同）。 @internal */
export interface PowerSyncRuleWriteRow extends PowerSyncRuleRow {}

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
 * Mapper for converting between PowerSync rows and domain Rule aggregates.
 * 用于 PowerSync 行数据与领域 Rule 聚合根之间转换的映射器。
 *
 * @internal Persistence mapper — not part of the public API.
 * @internal 持久化映射器 — 非公开 API。
 */
export class PowerSyncRuleMapper {
  /**
   * Converts a PowerSync row to a domain Rule aggregate.
   * 将 PowerSync 行数据转换为领域 Rule 聚合根。
   *
   * Deserializes JSON fields (tags, good_examples, bad_examples) and
   * reconstructs value objects (RuleTag, CodeSnippet).
   * 反序列化 JSON 字段（tags、good_examples、bad_examples）并重建值对象。
   *
   * @param row - Raw SQLite row data 原始 SQLite 行数据
   * @returns Hydrated Rule domain aggregate 水合后的 Rule 领域聚合根
   * @throws If tag values in persistence are invalid 如果持久化中的标签值无效则抛出异常
   */
  static toDomain(row: PowerSyncRuleRow): Rule {
    const tags = (JSON.parse(row.tags || '[]') as string[]).map((tagValue) => {
      const result = RuleTag.create(tagValue);
      if (!result.ok) throw new Error(`Invalid tag in persistence: ${tagValue}`);
      return result.data;
    });

    const goodExamples = (JSON.parse(row.good_examples || '[]') as CodeSnippetPersistenceDTO[]).map(
      (dto) => {
        const result = CodeSnippet.fromPersistenceDTO(dto);
        if (!result.ok)
          throw new Error(`Invalid good-example in persistence: ${result.error.message}`);
        return result.data;
      },
    );

    const badExamples = (JSON.parse(row.bad_examples || '[]') as CodeSnippetPersistenceDTO[]).map(
      (dto) => {
        const result = CodeSnippet.fromPersistenceDTO(dto);
        if (!result.ok)
          throw new Error(`Invalid bad-example in persistence: ${result.error.message}`);
        return result.data;
      },
    );

    return Rule.load({
      id: row.id as RuleId,
      code: row.code,
      title: row.title,
      description: row.description,
      severity: row.severity as RuleSeverity,
      status: row.status as RuleStatus,
      deprecationReason: row.deprecation_reason ?? undefined,
      replacementRuleId: (row.replacement_rule_id as RuleId | null) ?? undefined,
      liveReferenceLocation: row.live_reference_location ?? undefined,
      tags,
      codeSnippets: [...goodExamples, ...badExamples],
      authorId: row.author_id as IdentityId,
      createdAt: toDate(row.created_at),
      updatedAt: toDate(row.updated_at),
    });
  }

  /**
   * Converts a domain Rule aggregate to a PowerSync persistence row.
   * 将领域 Rule 聚合根转换为 PowerSync 持久化行数据。
   *
   * Serializes value objects to JSON strings and dates to ISO strings.
   * 将值对象序列化为 JSON 字符串，日期序列化为 ISO 字符串。
   *
   * @param rule - Domain Rule aggregate 领域 Rule 聚合根
   * @returns Flat row suitable for SQLite INSERT/UPDATE 适用于 SQLite INSERT/UPDATE 的扁平行数据
   */
  static toPersistence(rule: Rule): PowerSyncRuleWriteRow {
    return {
      id: rule.id,
      code: rule.code,
      title: rule.title,
      description: rule.description,
      severity: rule.severity,
      status: rule.status,
      deprecation_reason: rule.deprecationReason ?? null,
      replacement_rule_id: rule.replacementRuleId ?? null,
      live_reference_location: rule.liveReferenceLocation ?? null,
      tags: JSON.stringify(rule.tags.map((t) => t.value)),
      good_examples: JSON.stringify(rule.goodExamples.map((s) => s.toPersistenceDTO())),
      bad_examples: JSON.stringify(rule.badExamples.map((s) => s.toPersistenceDTO())),
      author_id: rule.authorId,
      created_at: rule.createdAt.toISOString(),
      updated_at: rule.updatedAt.toISOString(),
    };
  }

  /** Batch converts multiple rows to domain aggregates. 批量将多行数据转换为领域聚合根。 */
  static toDomainMany(rows: PowerSyncRuleRow[]): Rule[] {
    return rows.map((row) => PowerSyncRuleMapper.toDomain(row));
  }
}
