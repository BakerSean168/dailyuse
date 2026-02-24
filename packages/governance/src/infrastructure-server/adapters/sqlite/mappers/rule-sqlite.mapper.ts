/**
 * RuleSqliteMapper — SQLite 行 ↔ Rule 领域聚合根
 *
 * SQLite 存储约定（与 schema.ts 对应）：
 * - 日期：INTEGER（毫秒 epoch），读取时 `new Date(ms)`，写入时 `Date.getTime()`
 * - JSON：TEXT（tags / good_examples / bad_examples）
 * - 列名：snake_case
 *
 * 不负责子实体 RuleRevision 的映射（见 rule-revision-sqlite.mapper.ts）。
 */

import { Rule } from '../../../../domain-server/aggregates/rule';
import { RuleId } from '../../../../domain-shared/value-objects/rule-id';
import { RuleTag } from '../../../../domain-shared/value-objects/rule-tag';
import { CodeSnippet } from '../../../../domain-shared/value-objects/code-snippet';
import type { RuleStatus } from '../../../../domain-shared/value-objects/rule-status';
import type { RuleSeverity } from '../../../../domain-shared/value-objects/rule-severity';
import type { IdentityId } from '@dailyuse/contracts/primitives';
import type { CodeSnippetPersistenceDTO } from '../../../../contracts/value-objects/code-snippet';

// ---------------------------------------------------------------------------
// 原生 SQLite 行类型（better-sqlite3 返回 any，此处明确字段结构）
// ---------------------------------------------------------------------------
export interface RuleSqliteRow {
  id: string;
  code: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  deprecation_reason: string | null;
  replacement_rule_id: string | null;
  live_reference_location: string | null;
  tags: string;          // JSON TEXT
  good_examples: string; // JSON TEXT
  bad_examples: string;  // JSON TEXT
  author_id: string;
  created_at: number;    // INTEGER ms epoch
  updated_at: number;    // INTEGER ms epoch
}

// ---------------------------------------------------------------------------
// 写入 DTO（排除自动管理字段）
// ---------------------------------------------------------------------------
export interface RuleSqliteWriteRow extends RuleSqliteRow {}

// ---------------------------------------------------------------------------
// 日期帮助函数
// ---------------------------------------------------------------------------

/** JS Date → INTEGER ms epoch（SQLite 存储格式） */
export function dateToInt(date: Date | null | undefined): number | null {
  if (!date) return null;
  return date instanceof Date ? date.getTime() : new Date(date).getTime();
}

/** INTEGER ms epoch → JS Date */
function intToDate(ms: number): Date {
  return new Date(ms);
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

export class RuleSqliteMapper {
  /**
   * SQLite 行 → Rule 领域聚合根
   */
  static toDomain(row: RuleSqliteRow): Rule {
    const tags = (JSON.parse(row.tags || '[]') as string[]).map(tagValue => {
      const result = RuleTag.create(tagValue);
      if (!result.ok) throw new Error(`Invalid tag in SQLite: ${tagValue}`);
      return result.data;
    });

    const goodExamples = (JSON.parse(row.good_examples || '[]') as CodeSnippetPersistenceDTO[])
      .map(dto => CodeSnippet.fromPersistenceDTO(dto));

    const badExamples = (JSON.parse(row.bad_examples || '[]') as CodeSnippetPersistenceDTO[])
      .map(dto => CodeSnippet.fromPersistenceDTO(dto));

    return Rule.load({
      id: row.id as RuleId,
      code: row.code,
      title: row.title,
      description: row.description,
      severity: row.severity as RuleSeverity,
      status: row.status as RuleStatus,
      deprecationReason: row.deprecation_reason ?? undefined,
      replacementRuleId: row.replacement_rule_id as RuleId | undefined,
      liveReferenceLocation: row.live_reference_location ?? undefined,
      tags,
      codeSnippets: [...goodExamples, ...badExamples],
      authorId: row.author_id as IdentityId,
      createdAt: intToDate(row.created_at),
      updatedAt: intToDate(row.updated_at),
    });
  }

  /**
   * Rule 领域聚合根 → SQLite 写入行
   */
  static toPersistence(rule: Rule): RuleSqliteWriteRow {
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
      tags: JSON.stringify(rule.tags.map(t => t.value)),
      good_examples: JSON.stringify(rule.goodExamples.map(s => s.toPersistenceDTO())),
      bad_examples: JSON.stringify(rule.badExamples.map(s => s.toPersistenceDTO())),
      author_id: rule.authorId,
      created_at: rule.createdAt.getTime(),
      updated_at: rule.updatedAt.getTime(),
    };
  }

  /** 批量转换 */
  static toDomainMany(rows: RuleSqliteRow[]): Rule[] {
    return rows.map(r => RuleSqliteMapper.toDomain(r));
  }
}
