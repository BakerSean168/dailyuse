/**
 * PowerSync RuleRevision Repository - Infrastructure Server
 * PowerSync 规则修订版本仓储实现 - 基础设施服务端
 *
 * Implements IRuleRevisionRepository for offline-capable desktop (Electron + PowerSync).
 * 为支持离线的桌面端（Electron + PowerSync）实现 IRuleRevisionRepository 接口。
 *
 * Revision records are append-only (immutable audit log).
 * 修订版本记录为追加写入（不可变审计日志）。
 */
import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type { IRuleRevisionRepository } from '../../../domain-server/repositories/i-rule-revision-repository';
import type { RuleRevision } from '../../../domain-server/entities/rule-revision';
import type { RuleId } from '../../../domain-shared/value-objects/rule-id';
import { toResultErrorException } from '@dailyuse/contracts/result';
import { mapInfraErrorToResultError } from '@dailyuse/utils/errors';
import {
  PowerSyncRuleRevisionMapper,
  type PowerSyncRuleRevisionRow,
} from './mappers/powersync-rule-revision.mapper';

/**
 * PowerSync-backed RuleRevision repository.
 * 基于 PowerSync 的规则修订版本仓储。
 *
 * Stores immutable revision records tracking all changes to rules.
 * 存储不可变的修订版本记录，跟踪规则的所有变更。
 */
export class PowerSyncRuleRevisionRepository implements IRuleRevisionRepository {
  constructor(private readonly db: IElectronDatabase) {}

  /**
   * Inserts a new revision record (append-only, never updated).
   * 插入新的修订版本记录（仅追加，不更新）。
   *
   * @param revision - RuleRevision domain entity 规则修订版本领域实体
   */
  async save(revision: RuleRevision): Promise<void> {
    try {
      const row = PowerSyncRuleRevisionMapper.toPersistence(revision);
      await this.db.execute(
        `INSERT INTO rule_revisions (
           id, rule_id, revision_number, author_id,
           changed_fields, previous_values, new_values,
           change_type, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row.id,
          row.rule_id,
          row.revision_number,
          row.author_id,
          row.changed_fields,
          row.previous_values,
          row.new_values,
          row.change_type,
          row.created_at,
        ],
      );
    } catch (err) {
      throw toResultErrorException(mapInfraErrorToResultError(err, 'Failed to save revision'));
    }
  }

  /**
   * Finds all revisions for a given rule, ordered by revision number ascending.
   * 查找指定规则的所有修订版本，按修订版本号升序排列。
   *
   * @param ruleId - ID of the parent rule 父规则的 ID
   * @returns Array of RuleRevision entities 修订版本实体数组
   */
  async findByRuleId(ruleId: RuleId): Promise<RuleRevision[]> {
    try {
      const rows = await this.db.getAll<PowerSyncRuleRevisionRow>(
        `SELECT * FROM rule_revisions WHERE rule_id = ? ORDER BY revision_number ASC`,
        [ruleId],
      );
      return PowerSyncRuleRevisionMapper.toDomainMany(rows);
    } catch (err) {
      throw toResultErrorException(mapInfraErrorToResultError(err, 'Failed to find revisions'));
    }
  }

  /**
   * Finds a specific revision by rule ID and revision number.
   * 根据规则 ID 和修订版本号查找特定修订版本。
   *
   * @param ruleId - ID of the parent rule 父规则的 ID
   * @param revisionNumber - Revision number to find 要查找的修订版本号
   * @returns The RuleRevision or null if not found 返回修订版本，未找到时返回 null
   */
  async findByRuleIdAndNumber(
    ruleId: RuleId,
    revisionNumber: number,
  ): Promise<RuleRevision | null> {
    try {
      const row = await this.db.getOptional<PowerSyncRuleRevisionRow>(
        `SELECT * FROM rule_revisions WHERE rule_id = ? AND revision_number = ?`,
        [ruleId, revisionNumber],
      );
      return row ? PowerSyncRuleRevisionMapper.toDomain(row) : null;
    } catch (err) {
      throw toResultErrorException(mapInfraErrorToResultError(err, 'Failed to find revision'));
    }
  }

  /**
   * Counts total revisions for a rule (used for next revision number).
   * 统计规则的修订版本总数（用于确定下一个修订版本号）。
   *
   * @param ruleId - ID of the parent rule 父规则的 ID
   * @returns Total revision count 修订总数
   */
  async countByRuleId(ruleId: RuleId): Promise<number> {
    try {
      const result = await this.db.get<{ count: number }>(
        `SELECT COUNT(*) as count FROM rule_revisions WHERE rule_id = ?`,
        [ruleId],
      );
      return result.count;
    } catch (err) {
      throw toResultErrorException(mapInfraErrorToResultError(err, 'Failed to count revisions'));
    }
  }
}
