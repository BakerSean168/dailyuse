/**
 * RuleRevisionSqliteRepository — RuleRevision 仓储 SQLite 原生实现
 *
 * 基于 better-sqlite3 同步 API，提供修订历史的读写访问。
 * RuleRevision 是不可变审计记录：仅支持 INSERT，不支持 UPDATE/DELETE。
 */

import type Database from 'better-sqlite3';
import type { IRuleRevisionRepository } from '../../../domain-server/repositories/i-rule-revision-repository';
import type { RuleRevision } from '../../../domain-server/entities/rule-revision';
import type { RuleId } from '../../../domain-shared/value-objects/rule-id';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import {
  RuleRevisionSqliteMapper,
  type RuleRevisionSqliteRow,
} from './mappers/rule-revision-sqlite.mapper';

export class RuleRevisionSqliteRepository implements IRuleRevisionRepository {
  constructor(private readonly db: Database.Database) {}

  // ---------------------------------------------------------------------------
  // Write（insert only — 不可变）
  // ---------------------------------------------------------------------------

  async save(revision: RuleRevision): Promise<Result<void>> {
    try {
      const row = RuleRevisionSqliteMapper.toPersistence(revision);
      this.db
        .prepare(
          `
        INSERT INTO rule_revisions (
          id, rule_id, revision_number, author_id,
          changed_fields, previous_values, new_values,
          change_type, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .run(
          row.id,
          row.rule_id,
          row.revision_number,
          row.author_id,
          row.changed_fields,
          row.previous_values,
          row.new_values,
          row.change_type,
          row.created_at,
        );
      return ok(undefined);
    } catch (err) {
      return error('DATABASE_ERROR', `Failed to save revision`);
    }
  }

  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------

  async findByRuleId(ruleId: RuleId): Promise<Result<RuleRevision[]>> {
    try {
      const rows = this.db
        .prepare(`SELECT * FROM rule_revisions WHERE rule_id = ? ORDER BY revision_number ASC`)
        .all(ruleId) as RuleRevisionSqliteRow[];
      return ok(RuleRevisionSqliteMapper.toDomainMany(rows));
    } catch (err) {
      return error('DATABASE_ERROR', `Failed to find revisions`);
    }
  }

  async findByRuleIdAndNumber(
    ruleId: RuleId,
    revisionNumber: number,
  ): Promise<Result<RuleRevision | null>> {
    try {
      const row = this.db
        .prepare(`SELECT * FROM rule_revisions WHERE rule_id = ? AND revision_number = ?`)
        .get(ruleId, revisionNumber) as RuleRevisionSqliteRow | undefined;
      return ok(row ? RuleRevisionSqliteMapper.toDomain(row) : null);
    } catch (err) {
      return error('DATABASE_ERROR', `Failed to find revision`);
    }
  }

  async countByRuleId(ruleId: RuleId): Promise<Result<number>> {
    try {
      const result = this.db
        .prepare(`SELECT COUNT(*) as count FROM rule_revisions WHERE rule_id = ?`)
        .get(ruleId) as { count: number };
      return ok(result.count);
    } catch (err) {
      return error('DATABASE_ERROR', `Failed to count revisions`);
    }
  }
}
