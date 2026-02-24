/**
 * RuleSqliteRepository — Rule 仓储 SQLite 原生实现
 *
 * 基于 better-sqlite3 同步 API，外层 async 包装以满足 IRuleRepository 接口。
 *
 * 特性：
 * - INSERT OR REPLACE / ON CONFLICT DO UPDATE 实现 upsert
 * - db.transaction() 实现 saveWithRevision 原子写入
 * - 动态 WHERE 子句支持多条件过滤和关键词搜索
 * - tags 过滤通过 LIKE '%"tag"%' 实现精确单标签匹配
 */

import type Database from 'better-sqlite3';
import type { IRuleRepository, RuleFilter } from '../../../domain-server/repositories/i-rule-repository';
import type { Rule } from '../../../domain-server/aggregates/rule';
import type { RuleRevision } from '../../../domain-server/entities/rule-revision';
import type { RuleId } from '../../../domain-shared/value-objects/rule-id';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import { RuleSqliteMapper, type RuleSqliteRow } from './mappers/rule-sqlite.mapper';
import { RuleRevisionSqliteMapper } from './mappers/rule-revision-sqlite.mapper';

export class RuleSqliteRepository implements IRuleRepository {
  constructor(private readonly db: Database.Database) {}

  // ---------------------------------------------------------------------------
  // Write
  // ---------------------------------------------------------------------------

  async save(rule: Rule): Promise<Result<void>> {
    try {
      const row = RuleSqliteMapper.toPersistence(rule);
      this.db.prepare(`
        INSERT INTO rules (
          id, code, title, description, severity, status,
          deprecation_reason, replacement_rule_id, live_reference_location,
          tags, good_examples, bad_examples, author_id,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?
        )
        ON CONFLICT(id) DO UPDATE SET
          code                    = excluded.code,
          title                   = excluded.title,
          description             = excluded.description,
          severity                = excluded.severity,
          status                  = excluded.status,
          deprecation_reason      = excluded.deprecation_reason,
          replacement_rule_id     = excluded.replacement_rule_id,
          live_reference_location = excluded.live_reference_location,
          tags                    = excluded.tags,
          good_examples           = excluded.good_examples,
          bad_examples            = excluded.bad_examples,
          updated_at              = excluded.updated_at
      `).run(
        row.id, row.code, row.title, row.description, row.severity, row.status,
        row.deprecation_reason, row.replacement_rule_id, row.live_reference_location,
        row.tags, row.good_examples, row.bad_examples, row.author_id,
        row.created_at, row.updated_at,
      );
      return ok(undefined);
    } catch (err) {
      return error('DATABASE_ERROR', `Failed to save rule: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async saveWithRevision(rule: Rule, revision: RuleRevision): Promise<Result<void>> {
    try {
      const ruleRow = RuleSqliteMapper.toPersistence(rule);
      const revRow = RuleRevisionSqliteMapper.toPersistence(revision);

      const transaction = this.db.transaction(() => {
        // Upsert rule
        this.db.prepare(`
          INSERT INTO rules (
            id, code, title, description, severity, status,
            deprecation_reason, replacement_rule_id, live_reference_location,
            tags, good_examples, bad_examples, author_id,
            created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?
          )
          ON CONFLICT(id) DO UPDATE SET
            code                    = excluded.code,
            title                   = excluded.title,
            description             = excluded.description,
            severity                = excluded.severity,
            status                  = excluded.status,
            deprecation_reason      = excluded.deprecation_reason,
            replacement_rule_id     = excluded.replacement_rule_id,
            live_reference_location = excluded.live_reference_location,
            tags                    = excluded.tags,
            good_examples           = excluded.good_examples,
            bad_examples            = excluded.bad_examples,
            updated_at              = excluded.updated_at
        `).run(
          ruleRow.id, ruleRow.code, ruleRow.title, ruleRow.description, ruleRow.severity, ruleRow.status,
          ruleRow.deprecation_reason, ruleRow.replacement_rule_id, ruleRow.live_reference_location,
          ruleRow.tags, ruleRow.good_examples, ruleRow.bad_examples, ruleRow.author_id,
          ruleRow.created_at, ruleRow.updated_at,
        );

        // Insert revision（不可变，INSERT ONLY）
        this.db.prepare(`
          INSERT INTO rule_revisions (
            id, rule_id, revision_number, author_id,
            changed_fields, previous_values, new_values,
            change_type, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          revRow.id, revRow.rule_id, revRow.revision_number, revRow.author_id,
          revRow.changed_fields, revRow.previous_values, revRow.new_values,
          revRow.change_type, revRow.created_at,
        );
      });

      transaction();
      return ok(undefined);
    } catch (err) {
      return error('DATABASE_ERROR', `Failed to save rule with revision: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------

  async findById(id: RuleId): Promise<Result<Rule | null>> {
    try {
      const row = this.db.prepare(`SELECT * FROM rules WHERE id = ?`).get(id) as RuleSqliteRow | undefined;
      return ok(row ? RuleSqliteMapper.toDomain(row) : null);
    } catch (err) {
      return error('DATABASE_ERROR', `Failed to find rule by ID: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async findByCode(code: string): Promise<Result<Rule | null>> {
    try {
      const row = this.db.prepare(`SELECT * FROM rules WHERE code = ?`).get(code) as RuleSqliteRow | undefined;
      return ok(row ? RuleSqliteMapper.toDomain(row) : null);
    } catch (err) {
      return error('DATABASE_ERROR', `Failed to find rule by code: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async findAll(filter?: RuleFilter): Promise<Result<Rule[]>> {
    try {
      const { sql, params } = buildFilterWhere(filter);
      const rows = this.db.prepare(`SELECT * FROM rules${sql} ORDER BY updated_at DESC`).all(...params) as RuleSqliteRow[];
      return ok(RuleSqliteMapper.toDomainMany(rows));
    } catch (err) {
      return error('DATABASE_ERROR', `Failed to find rules: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async search(query: string, filter?: RuleFilter): Promise<Result<Rule[]>> {
    try {
      const keyword = query.trim();
      if (!keyword) return ok([]);

      const kw = `%${keyword}%`;
      // 关键词条件：code / title / description / tags 文本内容
      const kwClause = `(code LIKE ? OR title LIKE ? OR description LIKE ? OR tags LIKE ?)`;
      const kwParams: string[] = [kw, kw, kw, kw];

      const { sql: filterSql, params: filterParams } = buildFilterWhere(filter);

      // 合并：keyword 放 AND 前，filter 追加在后
      const where = filterSql
        ? ` WHERE ${kwClause}${filterSql.replace(' WHERE ', ' AND ')}`
        : ` WHERE ${kwClause}`;

      const rows = this.db
        .prepare(`SELECT * FROM rules${where} ORDER BY updated_at DESC`)
        .all(...kwParams, ...filterParams) as RuleSqliteRow[];

      return ok(RuleSqliteMapper.toDomainMany(rows));
    } catch (err) {
      return error('DATABASE_ERROR', `Failed to search rules: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Delete / Exists
  // ---------------------------------------------------------------------------

  async delete(id: RuleId): Promise<Result<void>> {
    try {
      const result = this.db.prepare(`DELETE FROM rules WHERE id = ?`).run(id);
      if (result.changes === 0) {
        return error('NOT_FOUND', `Rule with ID '${id}' not found`);
      }
      return ok(undefined);
    } catch (err) {
      return error('DATABASE_ERROR', `Failed to delete rule: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async exists(code: string): Promise<boolean> {
    try {
      const row = this.db.prepare(`SELECT id FROM rules WHERE code = ? LIMIT 1`).get(code);
      return row !== undefined;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// 帮助函数：动态构建 WHERE 子句
// ---------------------------------------------------------------------------

/**
 * 根据 RuleFilter 生成 WHERE 子句和参数数组。
 * tags 用引号包裹做精确单标签匹配：`tags LIKE '%"tag"%'`
 */
function buildFilterWhere(filter?: RuleFilter): { sql: string; params: unknown[] } {
  if (!filter) return { sql: '', params: [] };

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filter.status) {
    if (Array.isArray(filter.status)) {
      const placeholders = filter.status.map(() => '?').join(', ');
      conditions.push(`status IN (${placeholders})`);
      params.push(...filter.status);
    } else {
      conditions.push(`status = ?`);
      params.push(filter.status);
    }
  }

  if (filter.severity) {
    conditions.push(`severity = ?`);
    params.push(filter.severity);
  }

  if (filter.tags && filter.tags.length > 0) {
    // OR 语义：命中任意一个 tag 即返回
    const tagConditions = filter.tags.map(() => `tags LIKE ?`);
    conditions.push(`(${tagConditions.join(' OR ')})`);
    params.push(...filter.tags.map(t => `%"${t}"%`));
  }

  if (conditions.length === 0) return { sql: '', params: [] };
  return { sql: ` WHERE ${conditions.join(' AND ')}`, params };
}
