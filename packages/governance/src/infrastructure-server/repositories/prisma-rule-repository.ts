/**
 * PrismaRuleRepository - Prisma Implementation of IRuleRepository
 * 规则仓储 - Prisma实现
 * 
 * Implements IRuleRepository using Prisma ORM with SQLite database
 * 
 * Responsibilities:
 * - CRUD operations for Rule aggregate
 * - Query operations with filters
 * - Domain ↔ Prisma model conversion
 * - Transaction management (future)
 */

import type { PrismaClient } from '@dailyuse/database';
import type { IRuleRepository, RuleFilter } from '../../domain-server/repositories/i-rule-repository';
import type { Rule } from '../../domain-server/aggregates/rule';
import { RuleId } from '../../domain-shared/value-objects/rule-id';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import { RulePersistenceMapper } from '../mappers/rule-persistence-mapper';

/**
 * Prisma Rule Repository
 * 
 * Uses PrismaClient for database access
 */
export class PrismaRuleRepository implements IRuleRepository {
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
      const prismaData = RulePersistenceMapper.toPrisma(rule);

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
      return error('DATABASE_ERROR', `Failed to save rule: ${err instanceof Error ? err.message : String(err)}`);
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

      const rule = RulePersistenceMapper.toDomain(prismaRule);
      return ok(rule);
    } catch (err) {
      return error('DATABASE_ERROR', `Failed to find rule by ID: ${err instanceof Error ? err.message : String(err)}`);
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

      const rule = RulePersistenceMapper.toDomain(prismaRule);
      return ok(rule);
    } catch (err) {
      return error('DATABASE_ERROR', `Failed to find rule by code: ${err instanceof Error ? err.message : String(err)}`);
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
      const where: any = {};

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
        const tagConditions = filter.tags.map(tag => ({
          tags: { contains: `"${tag}"` },
        }));
        where.OR = tagConditions;
      }

      const prismaRules = await this.prisma.rule.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
      });

      const rules = RulePersistenceMapper.toDomainMany(prismaRules);
      return ok(rules);
    } catch (err) {
      return error('DATABASE_ERROR', `Failed to find rules: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Searches rules by keyword
   * 
   * Searches in:
   * - code
   * - title
   * - description
   * - tags (JSON string)
   * 
   * Returns results ordered by relevance (not implemented in MVP)
   */
  async search(query: string, filter?: RuleFilter): Promise<Result<Rule[]>> {
    try {
      const where: any = {
        OR: [
          { code: { contains: query } },
          { title: { contains: query } },
          { description: { contains: query } },
          { tags: { contains: query } },
        ],
      };

      // Apply additional filters
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

      const rules = RulePersistenceMapper.toDomainMany(prismaRules);
      return ok(rules);
    } catch (err) {
      return error('DATABASE_ERROR', `Failed to search rules: ${err instanceof Error ? err.message : String(err)}`);
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

      return error('DATABASE_ERROR', `Failed to delete rule: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Checks if rule code exists
   */
  async exists(code: string): Promise<boolean> {
    try {
      const count = await this.prisma.rule.count({
        where: { code },
      });

      return count > 0;
    } catch (err) {
      // If query fails, assume doesn't exist
      return false;
    }
  }

}
