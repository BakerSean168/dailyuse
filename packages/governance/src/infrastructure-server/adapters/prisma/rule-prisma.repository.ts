/**
 * RulePrismaRepository — Prisma-backed IRuleRepository implementation.
 * RulePrismaRepository —— 基于 Prisma 的 IRuleRepository 实现。
 *
 * Implements IRuleRepository using Prisma ORM with PostgreSQL/SQLite.
 * 使用 Prisma ORM（PostgreSQL/SQLite）实现 IRuleRepository 接口。
 *
 * Key characteristics:
 * 主要特性：
 * - Upsert semantics: save() handles both insert and update
 *   Upsert 语义：save() 同时处理插入和更新
 * - Atomic saveWithRevision: rule + revision persisted in a single transaction
 *   原子化 saveWithRevision：规则 + 修订版本在单个事务中持久化
 * - All methods return Result<T> — never throws
 *   所有方法返回 Result<T> —— 永不抛出异常
 * - Filter support: status (single/array), severity, tags (OR logic)
 *   过滤支持：状态（单值/数组）、严重级别、标签（OR 逻辑）
 *
 * @internal Concrete Prisma implementation — consumers should use IRuleRepository interface.
 * @internal Prisma 具体实现 —— 消费方应使用 IRuleRepository 接口。
 */

import type { Prisma, PrismaClient } from '@dailyuse/database';
import type {
  IRuleRepository,
  RuleFilter,
} from '../../../domain-server/repositories/i-rule-repository';
import type { Rule } from '../../../domain-server/aggregates/rule';
import type { RuleRevision } from '../../../domain-server/entities/rule-revision';
import { RuleId } from '../../../domain-shared/value-objects/rule-id';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import { RulePrismaMapper } from './mappers/rule-prisma.mapper';
import { RuleRevisionPrismaMapper } from './mappers/rule-revision-prisma.mapper';
import { withCause } from '../mapper-helpers';

/**
 * Prisma Rule Repository
 *
 * Uses PrismaClient for database access
 */
export class RulePrismaRepository implements IRuleRepository {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  /**
   * Saves a rule (upsert: insert if new, update if existing).
   * 保存规则（存在则更新，不存在则插入）。
   *
   * Uses Prisma upsert to handle both cases in a single operation.
   * 使用 Prisma upsert 在单次操作中处理两种情况。
   *
   * @param rule - Domain Rule aggregate to persist 要持久化的领域规则聚合根
   * @returns Result<void> - ok on success, error('INTERNAL_ERROR') on failure
   *                         成功返回 ok，失败返回 error('INTERNAL_ERROR')
   */
  async save(rule: Rule): Promise<Result<void>> {
    try {
      const prismaData = RulePrismaMapper.toPersistence(rule);

      await this.prisma.rule.upsert({
        where: { id: rule.id },
        create: {
          ...prismaData,
          id: rule.id,
          createdAt: rule.createdAt,
          updatedAt: rule.updatedAt,
        },
        update: {
          ...prismaData,
          updatedAt: rule.updatedAt,
        },
      });

      return ok(undefined);
    } catch (err) {
      return error('INTERNAL_ERROR', withCause('Failed to save rule', err));
    }
  }

  /**
   * Atomically saves a rule and its associated revision in a single transaction.
   * 在单个事务中原子化保存规则及其关联的修订版本。
   *
   * Uses Prisma interactive transaction to ensure both operations succeed or fail together.
   * 使用 Prisma 交互式事务确保两个操作同时成功或失败。
   *
   * @param rule - Domain Rule aggregate 领域规则聚合根
   * @param revision - Associated RuleRevision entity 关联的修订版本实体
   * @returns Result<void> - ok on success, error('INTERNAL_ERROR') on failure
   */
  async saveWithRevision(rule: Rule, revision: RuleRevision): Promise<Result<void>> {
    try {
      const prismaData = RulePrismaMapper.toPersistence(rule);

      const revisionData = RuleRevisionPrismaMapper.toPersistence(revision);

      await this.prisma.$transaction(async (tx) => {
        await tx.rule.upsert({
          where: { id: rule.id },
          create: {
            ...prismaData,
            id: rule.id,
            createdAt: rule.createdAt,
            updatedAt: rule.updatedAt,
          },
          update: {
            ...prismaData,
            updatedAt: rule.updatedAt,
          },
        });

        await tx.ruleRevision.create({ data: revisionData });
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
      const prismaRule = await this.prisma.rule.findUnique({
        where: { id },
      });

      if (!prismaRule) {
        return ok(null);
      }

      const rule = RulePrismaMapper.toDomain(prismaRule);
      return ok(rule);
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
      const prismaRule = await this.prisma.rule.findUnique({
        where: { code },
      });

      if (!prismaRule) {
        return ok(null);
      }

      const rule = RulePrismaMapper.toDomain(prismaRule);
      return ok(rule);
    } catch (err) {
      return error('INTERNAL_ERROR', withCause('Failed to find rule by code', err));
    }
  }

  /**
   * Retrieves all rules, optionally filtered by status/severity/tags.
   * 获取所有规则，可按状态/严重级别/标签过滤。
   *
   * Results are ordered by updatedAt DESC (most recently updated first).
   * 结果按 updatedAt 降序排列（最近更新的排在前面）。
   *
   * Filter semantics:
   * 过滤语义：
   * - status: single value or array (IN clause) 状态：单值或数组（IN 子句）
   * - severity: exact match 严重级别：精确匹配
   * - tags: OR logic — matches if any tag matches (JSON contains)
   *   标签：OR 逻辑 —— 匹配任一标签即可（JSON 包含匹配）
   *
   * @param filter - Optional filter criteria 可选的过滤条件
   * @returns Result containing array of Rule aggregates
   */
  async findAll(filter?: RuleFilter): Promise<Result<Rule[]>> {
    try {
      const where: Prisma.RuleWhereInput = {};

      // Filter by status
      if (filter?.status) {
        if (Array.isArray(filter.status)) {
          where.status = { in: filter.status };
        } else {
          where.status = filter.status;
        }
      }

      // Filter by severity
      if (filter?.severity) {
        where.severity = filter.severity;
      }

      // Filter by tags (JSON contains)
      // Note: SQLite JSON support is limited, so we use string matching
      if (filter?.tags && filter.tags.length > 0) {
        // For each tag, check if it's in the tags JSON array
        // This is a simplified approach; production might need full-text search
        const tagConditions: Prisma.RuleWhereInput[] = filter.tags.map((tag) => ({
          tags: { contains: `"${tag}"` },
        }));
        where.OR = tagConditions;
      }

      const prismaRules = await this.prisma.rule.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
      });

      const rules = RulePrismaMapper.toDomainMany(prismaRules);
      return ok(rules);
    } catch (err) {
      return error('INTERNAL_ERROR', withCause('Failed to find rules', err));
    }
  }

  /**
   * Searches rules by keyword across code, title, description, and tags.
   * 通过关键词在代码、标题、描述和标签中搜索规则。
   *
   * Keyword conditions use OR (match any field).
   * Tag filter conditions are ANDed with keywords (must satisfy both).
   * 关键词条件使用 OR（匹配任一字段）。
   * 标签过滤条件与关键词使用 AND（必须同时满足）。
   *
   * @param query - Search keyword 搜索关键词
   * @param filter - Optional additional filters 可选的附加过滤条件
   * @returns Result containing matched Rule aggregates
   */
  async search(query: string, filter?: RuleFilter): Promise<Result<Rule[]>> {
    try {
      const keyword = query.trim();
      if (keyword.length === 0) {
        return ok([]);
      }

      const keywordConditions: Prisma.RuleWhereInput[] = [
        { code: { contains: keyword } },
        { title: { contains: keyword } },
        { description: { contains: keyword } },
      ];

      const where: Prisma.RuleWhereInput = {};
      const andClauses: Prisma.RuleWhereInput[] = [{ OR: keywordConditions }];

      if (filter?.tags && filter.tags.length > 0) {
        const tagConditions: Prisma.RuleWhereInput[] = filter.tags.map((tag) => ({
          tags: { contains: `"${tag}"` },
        }));
        andClauses.push({ OR: tagConditions });
      }

      where.AND = andClauses;

      // Apply additional filters. 应用附加过滤条件。
      if (filter?.status) {
        if (Array.isArray(filter.status)) {
          where.status = { in: filter.status };
        } else {
          where.status = filter.status;
        }
      }

      if (filter?.severity) {
        where.severity = filter.severity;
      }

      const prismaRules = await this.prisma.rule.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
      });

      const rules = RulePrismaMapper.toDomainMany(prismaRules);
      return ok(rules);
    } catch (err) {
      return error('INTERNAL_ERROR', withCause('Failed to search rules', err));
    }
  }

  /**
   * Deletes a rule by ID (hard delete).
   * 根据 ID 删除规则（硬删除）。
   *
   * Returns NOT_FOUND if the rule does not exist.
   * 如果规则不存在，返回 NOT_FOUND。
   *
   * @param id - Rule ID to delete 要删除的规则 ID
   * @returns Result<void> - ok on success, error('NOT_FOUND') if missing, error('INTERNAL_ERROR') on failure
   */
  async delete(id: RuleId): Promise<Result<void>> {
    try {
      await this.prisma.rule.delete({
        where: { id },
      });

      return ok(undefined);
    } catch (err) {
      // Handle case where rule doesn't exist
      if (err instanceof Error && err.message.includes('Record to delete does not exist')) {
        return error('NOT_FOUND', `Rule with ID '${id}' not found`);
      }

      return error('INTERNAL_ERROR', withCause('Failed to delete rule', err));
    }
  }

  /**
   * Checks if a rule with the given code already exists.
   * 检查指定代码的规则是否已存在。
   *
   * @param code - Rule code to check 要检查的规则代码
   * @returns Result<boolean> - ok(true) if exists, ok(false) if not
   */
  async exists(code: string): Promise<Result<boolean>> {
    try {
      const count = await this.prisma.rule.count({
        where: { code },
      });

      return ok(count > 0);
    } catch (err) {
      return error('INTERNAL_ERROR', withCause('Failed to check rule existence', err));
    }
  }
}
