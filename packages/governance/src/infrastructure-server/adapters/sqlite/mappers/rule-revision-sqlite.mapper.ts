/**
 * RuleRevisionSqliteMapper — SQLite 行 ↔ RuleRevision 领域实体
 *
 * SQLite 存储约定：
 * - 日期：INTEGER（毫秒 epoch）
 * - changed_fields / previous_values / new_values：JSON TEXT
 * - 列名：snake_case
 *
 * RuleRevision 是不可变审计记录，仅支持 create，无 updated_at。
 */

import { RuleRevision } from '../../../../domain-server/entities/rule-revision';
import { RuleId } from '../../../../domain-shared/value-objects/rule-id';
import { RuleRevisionId } from '../../../../domain-shared/value-objects/rule-revision-id';
import type { IdentityId } from '@dailyuse/contracts/primitives';

// ---------------------------------------------------------------------------
// SQLite 行类型
// ---------------------------------------------------------------------------
export interface RuleRevisionSqliteRow {
  id: string;
  rule_id: string;
  revision_number: number;
  author_id: string;
  changed_fields: string;          // JSON TEXT：string[]
  previous_values: string | null;  // JSON TEXT：Record<string, unknown>
  new_values: string | null;       // JSON TEXT：Record<string, unknown>
  change_type: string;
  created_at: number;              // INTEGER ms epoch
}

export interface RuleRevisionSqliteWriteRow extends RuleRevisionSqliteRow {}

// ---------------------------------------------------------------------------
// ChangeType 枚举
// ---------------------------------------------------------------------------
type ChangeType = 'Created' | 'Updated' | 'Deprecated' | 'Reactivated';

// ---------------------------------------------------------------------------
// 帮助函数
// ---------------------------------------------------------------------------

function parseStringArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch { return []; }
}

function parseRecord(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as Record<string, unknown>;
  } catch { return {}; }
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

export class RuleRevisionSqliteMapper {
  /**
   * SQLite 行 → RuleRevision 领域实体
   */
  static toDomain(row: RuleRevisionSqliteRow): RuleRevision {
    return RuleRevision.load({
      id: row.id as RuleRevisionId,
      ruleId: row.rule_id as RuleId,
      revisionNumber: row.revision_number,
      authorId: row.author_id as IdentityId,
      changedFields: parseStringArray(row.changed_fields),
      previousValues: parseRecord(row.previous_values),
      newValues: parseRecord(row.new_values),
      changeType: row.change_type as ChangeType,
      createdAt: new Date(row.created_at),
    });
  }

  /**
   * RuleRevision 领域实体 → SQLite 写入行
   *
   * changedFields 是 Set，展开为数组后序列化。
   */
  static toPersistence(revision: RuleRevision): RuleRevisionSqliteWriteRow {
    return {
      id: revision.id,
      rule_id: revision.ruleId,
      revision_number: revision.revisionNumber,
      author_id: revision.authorId,
      changed_fields: JSON.stringify([...revision.changedFields]),
      previous_values: JSON.stringify(revision.previousValues),
      new_values: JSON.stringify(revision.newValues),
      change_type: revision.changeType,
      created_at: revision.createdAt.getTime(),
    };
  }

  /** 批量转换 */
  static toDomainMany(rows: RuleRevisionSqliteRow[]): RuleRevision[] {
    return rows.map(r => RuleRevisionSqliteMapper.toDomain(r));
  }
}
