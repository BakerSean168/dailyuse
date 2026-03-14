/**
 * PowerSync Rule Repository - Infrastructure Server
 * PowerSync 规则仓储实现 - 基础设施服务端
 *
 * Implements IRuleRepository for offline-capable desktop (Electron + PowerSync).
 * 为支持离线的桌面端（Electron + PowerSync）实现 IRuleRepository 接口。
 *
 * Key characteristics:
 * 主要特性：
 * - SQLite-based persistence via PowerSync SDK
 *   基于 SQLite 的持久化（通过 PowerSync SDK）
 * - Bi-directional sync with remote Supabase/Postgres
 *   与远程 Supabase/Postgres 双向同步
 * - Transaction support for atomic rule + revision saves
 *   支持事务以原子化保存规则 + 修订版本
 * - All errors mapped to canonical Result<T> type
 *   所有错误映射为标准的 Result<T> 类型
 */
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
import { withCause } from '../mapper-helpers';

/**
 * PowerSync-backed Rule repository for offline-capable desktop.
 * 基于 PowerSync 的规则仓储，支持桌面端离线操作。
 *
 * Uses IElectronDatabase (SQLite) for local persistence.
 * Data is automatically synced to/from the remote database by PowerSync SDK.
 * 使用 IElectronDatabase (SQLite) 进行本地持久化。
 * 数据由 PowerSync SDK 自动与远程数据库双向同步。
 */
export class PowerSyncRuleRepository implements IRuleRepository {
  constructor(private readonly db: IElectronDatabase) {}

  /**
   * Saves a rule (upsert: insert if new, update if existing).
   * 保存规则（存在则更新，不存在则插入）。
   *
   * @param rule - Domain Rule aggregate to persist 要持久化的领域规则聚合根
   * @returns Result<void> - ok on success, error('INTERNAL_ERROR') on failure
   *                         成功返回 ok，失败返回 error('INTERNAL_ERROR')
   */
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
    } catch (err) {
      return error('INTERNAL_ERROR', withCause('Failed to save rule', err));
    }
  }

  /**
   * Atomically saves a rule and its associated revision in a single transaction.
   * 在单个事务中原子化保存规则及其关联的修订版本。
   *
   * Uses writeTransaction to ensure both the rule and revision are persisted
   * together, preventing inconsistent state if either operation fails.
   * 使用 writeTransaction 确保规则和修订版本一起持久化，
   * 防止任一操作失败导致的数据不一致。
   *
   * @param rule - Domain Rule aggregate 领域规则聚合根
   * @param revision - Associated RuleRevision entity 关联的修订版本实体
   * @returns Result<void> - ok on success, error('INTERNAL_ERROR') on failure
   */
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
    } catch (err) {
      return error('INTERNAL_ERROR', withCause('Failed to save rule with revision', err));
    }
  }

  /**
   * Finds a rule by its unique ID.
   * 根据唯一 ID 查找规则。
   *
   * @param id - Rule ID (branded type) 规则 ID（品牌类型）
   * @returns Result containing the Rule or null if not found
   *          包含规则的 Result，未找到时为 null
   */
  async findById(id: RuleId): Promise<Result<Rule | null>> {
    try {
      const row = await this.db.getOptional<PowerSyncRuleRow>(`SELECT * FROM rules WHERE id = ?`, [
        id,
      ]);
      return ok(row ? PowerSyncRuleMapper.toDomain(row) : null);
    } catch (err) {
      return error('INTERNAL_ERROR', withCause('Failed to find rule by ID', err));
    }
  }

  /**
   * Finds a rule by its unique code (e.g. 'DDD-001').
   * 根据唯一代码查找规则（例如 'DDD-001'）。
   *
   * @param code - Rule code string 规则代码字符串
   * @returns Result containing the Rule or null if not found
   */
  async findByCode(code: string): Promise<Result<Rule | null>> {
    try {
      const row = await this.db.getOptional<PowerSyncRuleRow>(
        `SELECT * FROM rules WHERE code = ?`,
        [code],
      );
      return ok(row ? PowerSyncRuleMapper.toDomain(row) : null);
    } catch (err) {
      return error('INTERNAL_ERROR', withCause('Failed to find rule by code', err));
    }
  }

  /**
   * Retrieves all rules, optionally filtered by status/severity/tags.
   * 获取所有规则，可按状态/严重级别/标签过滤。
   *
   * Results are ordered by updated_at DESC (most recently updated first).
   * 结果按 updated_at 降序排列（最近更新的排在前面）。
   *
   * @param filter - Optional filter criteria 可选的过滤条件
   * @returns Result containing array of Rule aggregates
   */
  async findAll(filter?: RuleFilter): Promise<Result<Rule[]>> {
    try {
      const { sql, params } = buildFilterWhere(filter);
      const rows = await this.db.getAll<PowerSyncRuleRow>(
        `SELECT * FROM rules${sql} ORDER BY updated_at DESC`,
        params,
      );
      return ok(PowerSyncRuleMapper.toDomainMany(rows));
    } catch (err) {
      return error('INTERNAL_ERROR', withCause('Failed to find rules', err));
    }
  }

  /**
   * Full-text search across code, title, description, and tags.
   * 在代码、标题、描述和标签中进行全文搜索。
   *
   * Uses SQL LIKE for keyword matching (case-insensitive on SQLite).
   * Combines keyword search with optional RuleFilter criteria.
   * 使用 SQL LIKE 进行关键词匹配（SQLite 上不区分大小写）。
   * 将关键词搜索与可选的 RuleFilter 条件组合。
   *
   * @param query - Search keyword 搜索关键词
   * @param filter - Optional additional filter criteria 可选的附加过滤条件
   * @returns Result containing matched Rule aggregates
   */
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
    } catch (err) {
      return error('INTERNAL_ERROR', withCause('Failed to search rules', err));
    }
  }

  /**
   * Deletes a rule by ID. Returns NOT_FOUND if no matching row.
   * 根据 ID 删除规则。如果没有匹配的行，返回 NOT_FOUND。
   *
   * @param id - Rule ID to delete 要删除的规则 ID
   * @returns Result<void> - ok on success, error('NOT_FOUND') if missing
   */
  async delete(id: RuleId): Promise<Result<void>> {
    try {
      const result = await this.db.execute(`DELETE FROM rules WHERE id = ?`, [id]);
      if (result.rowsAffected === 0) {
        return error('NOT_FOUND', `Rule with ID '${id}' not found`);
      }
      return ok(undefined);
    } catch (err) {
      return error('INTERNAL_ERROR', withCause('Failed to delete rule', err));
    }
  }

  /**
   * Checks if a rule with the given code already exists.
   * 检查指定代码的规则是否已存在。
   *
   * Used for uniqueness validation before creating new rules.
   * 用于创建新规则前的唯一性校验。
   *
   * @param code - Rule code to check 要检查的规则代码
   * @returns true if exists, false otherwise (also false on error)
   */
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

/**
 * Builds a SQL WHERE clause from RuleFilter criteria.
 * 从 RuleFilter 条件构建 SQL WHERE 子句。
 *
 * Supports filtering by:
 * 支持按以下条件过滤：
 * - status: single value or array (IN clause) 状态：单值或数组（IN 子句）
 * - severity: exact match 严重级别：精确匹配
 * - tags: LIKE match on JSON-stringified tags column 标签：JSON 序列化标签列的 LIKE 匹配
 *
 * @param filter - Optional filter criteria 可选的过滤条件
 * @returns Object with sql string and params array SQL 字符串和参数数组
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
    const tagConditions = filter.tags.map(() => `tags LIKE ?`);
    conditions.push(`(${tagConditions.join(' OR ')})`);
    params.push(...filter.tags.map((t) => `%"${t}"%`));
  }

  if (conditions.length === 0) return { sql: '', params: [] };
  return { sql: ` WHERE ${conditions.join(' AND ')}`, params };
}
