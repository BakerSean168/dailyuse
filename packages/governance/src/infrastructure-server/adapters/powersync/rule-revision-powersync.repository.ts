import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type { IRuleRevisionRepository } from '../../../domain-server/repositories/i-rule-revision-repository';
import type { RuleRevision } from '../../../domain-server/entities/rule-revision';
import type { RuleId } from '../../../domain-shared/value-objects/rule-id';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import {
  PowerSyncRuleRevisionMapper,
  type PowerSyncRuleRevisionRow,
} from './mappers/powersync-rule-revision.mapper';

export class PowerSyncRuleRevisionRepository implements IRuleRevisionRepository {
  constructor(private readonly db: IElectronDatabase) {}

  async save(revision: RuleRevision): Promise<Result<void>> {
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
      return ok(undefined);
    } catch {
      return error('INTERNAL_ERROR', 'Failed to save revision');
    }
  }

  async findByRuleId(ruleId: RuleId): Promise<Result<RuleRevision[]>> {
    try {
      const rows = await this.db.getAll<PowerSyncRuleRevisionRow>(
        `SELECT * FROM rule_revisions WHERE rule_id = ? ORDER BY revision_number ASC`,
        [ruleId],
      );
      return ok(PowerSyncRuleRevisionMapper.toDomainMany(rows));
    } catch {
      return error('INTERNAL_ERROR', 'Failed to find revisions');
    }
  }

  async findByRuleIdAndNumber(
    ruleId: RuleId,
    revisionNumber: number,
  ): Promise<Result<RuleRevision | null>> {
    try {
      const row = await this.db.getOptional<PowerSyncRuleRevisionRow>(
        `SELECT * FROM rule_revisions WHERE rule_id = ? AND revision_number = ?`,
        [ruleId, revisionNumber],
      );
      return ok(row ? PowerSyncRuleRevisionMapper.toDomain(row) : null);
    } catch {
      return error('INTERNAL_ERROR', 'Failed to find revision');
    }
  }

  async countByRuleId(ruleId: RuleId): Promise<Result<number>> {
    try {
      const result = await this.db.get<{ count: number }>(
        `SELECT COUNT(*) as count FROM rule_revisions WHERE rule_id = ?`,
        [ruleId],
      );
      return ok(result.count);
    } catch {
      return error('INTERNAL_ERROR', 'Failed to count revisions');
    }
  }
}
