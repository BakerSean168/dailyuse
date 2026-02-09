/**
 * PrismaRuleRevisionRepository - Prisma Implementation of IRuleRevisionRepository
 * 规则修订记录仓储 - Prisma实现
 * 
 * Implements IRuleRevisionRepository for read-only revision history access
 */

import { PrismaClient } from '@prisma/client-governance';
import type { IRuleRevisionRepository } from '../../domain-server/repositories/i-rule-revision-repository';
import { RuleRevision } from '../../domain-server/entities/rule-revision';
import { RuleId, RuleRevisionId } from '../../domain-shared/value-objects';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

/**
 * Prisma RuleRevision Repository
 * 
 * Provides read-only access to revision history
 */
export class PrismaRuleRevisionRepository implements IRuleRevisionRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.GOVERNANCE_DATABASE_URL || 'file:./governance.db',
        },
      },
    });
  }

  /**
   * Saves revision (insert only)
   */
  async save(revision: RuleRevision): Promise<Result<void>> {
    try {
      const dto = revision.toPersistenceDTO();

      await this.prisma.ruleRevision.create({
        data: {
          id: dto.id,
          ruleId: dto.ruleId,
          revisionNumber: dto.revisionNumber,
          authorId: dto.authorId,
          changedFields: dto.changedFields,
          previousValues: dto.previousValues,
          newValues: dto.newValues,
          changeType: dto.changeType,
          createdAt: dto.createdAt,
        },
      });

      return ok(undefined);
    } catch (err) {
      return error('DATABASE_ERROR', `Failed to save revision: ${err instanceof Error ? err.message : String(err)}`);
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

      const revisions = prismaRevisions.map(pr =>
        RuleRevision.fromPersistence({
          id: pr.id as RuleRevisionId,
          ruleId: pr.ruleId as RuleId,
          revisionNumber: pr.revisionNumber,
          authorId: pr.authorId as any, // Type cast to IdentityId
          changedFields: JSON.parse(pr.changedFields),
          previousValues: pr.previousValues ? JSON.parse(pr.previousValues) : {},
          newValues: pr.newValues ? JSON.parse(pr.newValues) : {},
          changeType: pr.changeType as 'Created' | 'Updated' | 'Deprecated' | 'Reactivated',
          createdAt: pr.createdAt,
        })
      );

      return ok(revisions);
    } catch (err) {
      return error('DATABASE_ERROR', `Failed to find revisions: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Finds specific revision by rule ID and revision number
   */
  async findByRuleIdAndNumber(
    ruleId: RuleId,
    revisionNumber: number
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

      const revision = RuleRevision.fromPersistence({
        id: prismaRevision.id as RuleRevisionId,
        ruleId: prismaRevision.ruleId as RuleId,
        revisionNumber: prismaRevision.revisionNumber,
        authorId: prismaRevision.authorId as any, // Type cast to IdentityId
        changedFields: JSON.parse(prismaRevision.changedFields),
        previousValues: prismaRevision.previousValues ? JSON.parse(prismaRevision.previousValues) : {},
        newValues: prismaRevision.newValues ? JSON.parse(prismaRevision.newValues) : {},
        changeType: prismaRevision.changeType as 'Created' | 'Updated' | 'Deprecated' | 'Reactivated',
        createdAt: prismaRevision.createdAt,
      });

      return ok(revision);
    } catch (err) {
      return error('DATABASE_ERROR', `Failed to find revision: ${err instanceof Error ? err.message : String(err)}`);
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
      return error('DATABASE_ERROR', `Failed to count revisions: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Disconnect Prisma client
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
