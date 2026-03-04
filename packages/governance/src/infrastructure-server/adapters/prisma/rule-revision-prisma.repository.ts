/**
 * RuleRevision Prisma Repository
 * 规则修订记录仓储 - Prisma实现
 *
 * Implements IRuleRevisionRepository for read-only revision history access
 */

import type { PrismaClient } from '@dailyuse/database';
import type { IRuleRevisionRepository } from '../../../domain-server/repositories/i-rule-revision-repository';
import { RuleRevision } from '../../../domain-server/entities/rule-revision';
import { RuleId } from '../../../domain-shared/value-objects';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import { RuleRevisionPrismaMapper } from './mappers/rule-revision-prisma.mapper';

/**
 * Prisma RuleRevision Repository
 *
 * Provides read-only access to revision history
 */
export class RuleRevisionPrismaRepository implements IRuleRevisionRepository {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  /**
   * Saves revision (insert only)
   */
  async save(revision: RuleRevision): Promise<Result<void>> {
    try {
      await this.prisma.ruleRevision.create({
        data: RuleRevisionPrismaMapper.toPersistence(revision),
      });

      return ok(undefined);
    } catch (err) {
      return error('DATABASE_ERROR', `Failed to save revision`);
    }
  }

  /**
   * Finds all revisions for a rule
   */
  async findByRuleId(ruleId: RuleId): Promise<Result<RuleRevision[]>> {
    try {
      const prismaRevisions = await this.prisma.ruleRevision.findMany({
        where: { ruleId },
        orderBy: { revisionNumber: 'asc' },
      });

      const revisions = RuleRevisionPrismaMapper.toDomainMany(prismaRevisions);

      return ok(revisions);
    } catch (err) {
      return error('DATABASE_ERROR', `Failed to find revisions`);
    }
  }

  /**
   * Finds specific revision by rule ID and revision number
   */
  async findByRuleIdAndNumber(
    ruleId: RuleId,
    revisionNumber: number,
  ): Promise<Result<RuleRevision | null>> {
    try {
      const prismaRevision = await this.prisma.ruleRevision.findUnique({
        where: {
          ruleId_revisionNumber: {
            ruleId,
            revisionNumber,
          },
        },
      });

      if (!prismaRevision) {
        return ok(null);
      }

      const revision = RuleRevisionPrismaMapper.toDomain(prismaRevision);

      return ok(revision);
    } catch (err) {
      return error('DATABASE_ERROR', `Failed to find revision`);
    }
  }

  /**
   * Counts total revisions for a rule
   */
  async countByRuleId(ruleId: RuleId): Promise<Result<number>> {
    try {
      const count = await this.prisma.ruleRevision.count({
        where: { ruleId },
      });

      return ok(count);
    } catch (err) {
      return error('DATABASE_ERROR', `Failed to count revisions`);
    }
  }
}
