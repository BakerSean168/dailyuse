import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type {
  IRuleRepository,
  RuleFilter,
} from '../../../domain-server/repositories/i-rule-repository';
import type { Rule } from '../../../domain-server/aggregates/rule';
import type { RuleRevision } from '../../../domain-server/entities/rule-revision';
import type { RuleId } from '../../../domain-shared/value-objects/rule-id';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import { PowerSyncRuleMapper, type PowerSyncRuleRow } from './mappers/powersync-rule.mapper';
import { PowerSyncRuleRevisionMapper } from './mappers/powersync-rule-revision.mapper';

export class PowerSyncRuleRepository implements IRuleRepository {
  constructor(private readonly db: IElectronDatabase) {}

  async save(rule: Rule): Promise<Result<void>> {
    try {
      const row = PowerSyncRuleMapper.toPersistence(rule);
      const existing = await this.db.getOptional<{ id: string }>(
        `SELECT id FROM rules WHERE id = ? LIMIT 1`,
        [row.id],
      );

      if (existing) {
        await this.db.execute(
          `UPDATE rules
           SET code = ?,
               title = ?,
               description = ?,
               severity = ?,
               status = ?,
               deprecation_reason = ?,
               replacement_rule_id = ?,
               live_reference_location = ?,
               tags = ?,
               good_examples = ?,
               bad_examples = ?,
               author_id = ?,
               updated_at = ?
           WHERE id = ?`,
          [
            row.code,
            row.title,
            row.description,
            row.severity,
            row.status,
            row.deprecation_reason,
            row.replacement_rule_id,
            row.live_reference_location,
            row.tags,
            row.good_examples,
            row.bad_examples,
            row.author_id,
            row.updated_at,
            row.id,
          ],
        );
      } else {
        await this.db.execute(
          `INSERT INTO rules (
             id, code, title, description, severity, status,
             deprecation_reason, replacement_rule_id, live_reference_location,
             tags, good_examples, bad_examples, author_id,
             created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            row.id,
            row.code,
            row.title,
            row.description,
            row.severity,
            row.status,
            row.deprecation_reason,
            row.replacement_rule_id,
            row.live_reference_location,
            row.tags,
            row.good_examples,
            row.bad_examples,
            row.author_id,
            row.created_at,
            row.updated_at,
          ],
        );
      }
      return ok(undefined);
    } catch {
      return error('DATABASE_ERROR', 'Failed to save rule');
    }
  }

  async saveWithRevision(rule: Rule, revision: RuleRevision): Promise<Result<void>> {
    try {
      const ruleRow = PowerSyncRuleMapper.toPersistence(rule);
      const revRow = PowerSyncRuleRevisionMapper.toPersistence(revision);

      await this.db.writeTransaction(async (tx) => {
        const existing = await tx.getOptional<{ id: string }>(
          `SELECT id FROM rules WHERE id = ? LIMIT 1`,
          [ruleRow.id],
        );

        if (existing) {
          await tx.execute(
            `UPDATE rules
             SET code = ?,
                 title = ?,
                 description = ?,
                 severity = ?,
                 status = ?,
                 deprecation_reason = ?,
                 replacement_rule_id = ?,
                 live_reference_location = ?,
                 tags = ?,
                 good_examples = ?,
                 bad_examples = ?,
                 author_id = ?,
                 updated_at = ?
             WHERE id = ?`,
            [
              ruleRow.code,
              ruleRow.title,
              ruleRow.description,
              ruleRow.severity,
              ruleRow.status,
              ruleRow.deprecation_reason,
              ruleRow.replacement_rule_id,
              ruleRow.live_reference_location,
              ruleRow.tags,
              ruleRow.good_examples,
              ruleRow.bad_examples,
              ruleRow.author_id,
              ruleRow.updated_at,
              ruleRow.id,
            ],
          );
        } else {
          await tx.execute(
            `INSERT INTO rules (
               id, code, title, description, severity, status,
               deprecation_reason, replacement_rule_id, live_reference_location,
               tags, good_examples, bad_examples, author_id,
               created_at, updated_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              ruleRow.id,
              ruleRow.code,
              ruleRow.title,
              ruleRow.description,
              ruleRow.severity,
              ruleRow.status,
              ruleRow.deprecation_reason,
              ruleRow.replacement_rule_id,
              ruleRow.live_reference_location,
              ruleRow.tags,
              ruleRow.good_examples,
              ruleRow.bad_examples,
              ruleRow.author_id,
              ruleRow.created_at,
              ruleRow.updated_at,
            ],
          );
        }

        await tx.execute(
          `INSERT INTO rule_revisions (
             id, rule_id, revision_number, author_id,
             changed_fields, previous_values, new_values,
             change_type, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            revRow.id,
            revRow.rule_id,
            revRow.revision_number,
            revRow.author_id,
            revRow.changed_fields,
            revRow.previous_values,
            revRow.new_values,
            revRow.change_type,
            revRow.created_at,
          ],
        );
      });

      return ok(undefined);
    } catch {
      return error('DATABASE_ERROR', 'Failed to save rule with revision');
    }
  }

  async findById(id: RuleId): Promise<Result<Rule | null>> {
    try {
      const row = await this.db.getOptional<PowerSyncRuleRow>(`SELECT * FROM rules WHERE id = ?`, [
        id,
      ]);
      return ok(row ? PowerSyncRuleMapper.toDomain(row) : null);
    } catch {
      return error('DATABASE_ERROR', 'Failed to find rule by ID');
    }
  }

  async findByCode(code: string): Promise<Result<Rule | null>> {
    try {
      const row = await this.db.getOptional<PowerSyncRuleRow>(
        `SELECT * FROM rules WHERE code = ?`,
        [code],
      );
      return ok(row ? PowerSyncRuleMapper.toDomain(row) : null);
    } catch {
      return error('DATABASE_ERROR', 'Failed to find rule by code');
    }
  }

  async findAll(filter?: RuleFilter): Promise<Result<Rule[]>> {
    try {
      const { sql, params } = buildFilterWhere(filter);
      const rows = await this.db.getAll<PowerSyncRuleRow>(
        `SELECT * FROM rules${sql} ORDER BY updated_at DESC`,
        params,
      );
      return ok(PowerSyncRuleMapper.toDomainMany(rows));
    } catch {
      return error('DATABASE_ERROR', 'Failed to find rules');
    }
  }

  async search(query: string, filter?: RuleFilter): Promise<Result<Rule[]>> {
    try {
      const keyword = query.trim();
      if (!keyword) return ok([]);

      const kw = `%${keyword}%`;
      const kwClause = `(code LIKE ? OR title LIKE ? OR description LIKE ? OR tags LIKE ?)`;
      const kwParams: string[] = [kw, kw, kw, kw];

      const { sql: filterSql, params: filterParams } = buildFilterWhere(filter);
      const where = filterSql
        ? ` WHERE ${kwClause}${filterSql.replace(' WHERE ', ' AND ')}`
        : ` WHERE ${kwClause}`;

      const rows = await this.db.getAll<PowerSyncRuleRow>(
        `SELECT * FROM rules${where} ORDER BY updated_at DESC`,
        [...kwParams, ...filterParams],
      );

      return ok(PowerSyncRuleMapper.toDomainMany(rows));
    } catch {
      return error('DATABASE_ERROR', 'Failed to search rules');
    }
  }

  async delete(id: RuleId): Promise<Result<void>> {
    try {
      const result = await this.db.execute(`DELETE FROM rules WHERE id = ?`, [id]);
      if (result.rowsAffected === 0) {
        return error('NOT_FOUND', `Rule with ID '${id}' not found`);
      }
      return ok(undefined);
    } catch {
      return error('DATABASE_ERROR', 'Failed to delete rule');
    }
  }

  async exists(code: string): Promise<boolean> {
    try {
      const row = await this.db.getOptional<{ id: string }>(
        `SELECT id FROM rules WHERE code = ? LIMIT 1`,
        [code],
      );
      return row !== null;
    } catch {
      return false;
    }
  }
}

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
    const tagConditions = filter.tags.map(() => `tags LIKE ?`);
    conditions.push(`(${tagConditions.join(' OR ')})`);
    params.push(...filter.tags.map((t) => `%"${t}"%`));
  }

  if (conditions.length === 0) return { sql: '', params: [] };
  return { sql: ` WHERE ${conditions.join(' AND ')}`, params };
}
