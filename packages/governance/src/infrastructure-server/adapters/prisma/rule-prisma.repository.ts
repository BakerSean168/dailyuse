/**
 * Rule Prisma Repository
 * 规则仓储 - Prisma实现
 *
 * Implements IRuleRepository using Prisma ORM with PostgreSQL/SQLite database
 *
 * Responsibilities:
 * - CRUD operations for Rule aggregate
 * - Query operations with filters
 * - Domain ↔ Prisma model conversion
 * - Transaction management (future)
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
   * Saves rule (insert or update)
   *
   * Uses upsert to handle both create and update cases
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
   * Saves rule and revision atomically (single transaction)
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
   * Finds rule by ID
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
   * Finds rule by unique code
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
   * Finds all rules matching filter
   *
   * Supports filtering by:
   * - status (single or array)
   * - severity (single value)
   * - tags (OR logic - matches if any tag matches)
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
   * Deletes rule (hard delete)
   *
   * Note: In production, this should check for revisions first
   * and only allow deletion of Draft rules without revisions
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
