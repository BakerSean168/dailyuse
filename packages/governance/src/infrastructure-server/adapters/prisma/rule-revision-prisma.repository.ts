/**
 * RuleRevisionPrismaRepository — Prisma-backed IRuleRevisionRepository implementation.
 * RuleRevisionPrismaRepository —— 基于 Prisma 的 IRuleRevisionRepository 实现。
 *
 * Implements IRuleRevisionRepository for immutable revision history access.
 * 实现 IRuleRevisionRepository 接口，提供不可变修订历史访问。
 *
 * Key characteristics:
 * 主要特性：
 * - Append-only audit log: revision records are created, never updated
 *   仅追加审计日志：修订记录只创建，不更新
 * - All methods return Result<T> — never throws
 *   所有方法返回 Result<T> —— 永不抛出异常
 * - Query by ruleId (all revisions) or by ruleId + revisionNumber (specific)
 *   按 ruleId 查询（全部修订版本）或按 ruleId + revisionNumber 查询（特定版本）
 *
 * @internal Concrete Prisma implementation — consumers should use IRuleRevisionRepository interface.
 * @internal Prisma 具体实现 —— 消费方应使用 IRuleRevisionRepository 接口。
 */

import type { PrismaClient } from '@dailyuse/database';
import type { IRuleRevisionRepository } from '../../../domain-server/repositories/i-rule-revision-repository';
import { RuleRevision } from '../../../domain-server/entities/rule-revision';
import { RuleId } from '../../../domain-shared/value-objects';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import { RuleRevisionPrismaMapper } from './mappers/rule-revision-prisma.mapper';
import { withCause } from '../mapper-helpers';

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
   * Inserts a new revision record (append-only, never updated).
   * 插入新的修订版本记录（仅追加，不更新）。
   *
   * @param revision - RuleRevision domain entity to persist 要持久化的 RuleRevision 领域实体
   * @returns Result<void> - ok on success, error('INTERNAL_ERROR') on failure
   */
  async save(revision: RuleRevision): Promise<Result<void>> {
    try {
      await this.prisma.ruleRevision.create({
        data: RuleRevisionPrismaMapper.toPersistence(revision),
      });

      return ok(undefined);
    } catch (err) {
      return error('INTERNAL_ERROR', withCause('Failed to save revision', err));
    }
  }

  /**
   * Finds all revisions for a given rule, ordered by revision number ascending.
   * 查找指定规则的所有修订版本，按修订版本号升序排列。
   *
   * @param ruleId - ID of the parent rule 父规则的 ID
   * @returns Result containing array of RuleRevision entities
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
      return error('INTERNAL_ERROR', withCause('Failed to find revisions', err));
    }
  }

  /**
   * Finds a specific revision by rule ID and revision number.
   * 根据规则 ID 和修订版本号查找特定修订版本。
   *
   * @param ruleId - ID of the parent rule 父规则的 ID
   * @param revisionNumber - Revision number to find 要查找的修订版本号
   * @returns Result containing the RuleRevision or null if not found
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
      return error('INTERNAL_ERROR', withCause('Failed to find revision', err));
    }
  }

  /**
   * Counts total revisions for a rule (used for next revision number).
   * 统计规则的修订版本总数（用于确定下一个修订版本号）。
   *
   * @param ruleId - ID of the parent rule 父规则的 ID
   * @returns Result containing the count
   */
  async countByRuleId(ruleId: RuleId): Promise<Result<number>> {
    try {
      const count = await this.prisma.ruleRevision.count({
        where: { ruleId },
      });

      return ok(count);
    } catch (err) {
      return error('INTERNAL_ERROR', withCause('Failed to count revisions', err));
    }
  }
}
