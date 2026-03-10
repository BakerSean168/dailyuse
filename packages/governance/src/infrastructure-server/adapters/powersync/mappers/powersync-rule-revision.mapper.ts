import { RuleRevision } from '../../../../domain-server/entities/rule-revision';
import { RuleId } from '../../../../domain-shared/value-objects/rule-id';
import { RuleRevisionId } from '../../../../domain-shared/value-objects/rule-revision-id';
import type { IdentityId } from '@dailyuse/contracts/primitives';

type ChangeType = 'Created' | 'Updated' | 'Deprecated' | 'Reactivated';

export interface PowerSyncRuleRevisionRow {
  id: string;
  rule_id: string;
  revision_number: number;
  author_id: string;
  changed_fields: string;
  previous_values: string | null;
  new_values: string | null;
  change_type: string;
  created_at: string;
}

export interface PowerSyncRuleRevisionWriteRow extends PowerSyncRuleRevisionRow {}

function parseStringArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function parseRecord(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
}

function toDate(value: string | null | undefined): Date {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export class PowerSyncRuleRevisionMapper {
  static toDomain(row: PowerSyncRuleRevisionRow): RuleRevision {
    return RuleRevision.load({
      id: row.id as RuleRevisionId,
      ruleId: row.rule_id as RuleId,
      revisionNumber: row.revision_number,
      authorId: row.author_id as IdentityId,
      changedFields: parseStringArray(row.changed_fields),
      previousValues: parseRecord(row.previous_values),
      newValues: parseRecord(row.new_values),
      changeType: row.change_type as ChangeType,
      createdAt: toDate(row.created_at),
    });
  }

  static toPersistence(revision: RuleRevision): PowerSyncRuleRevisionWriteRow {
    return {
      id: revision.id,
      rule_id: revision.ruleId,
      revision_number: revision.revisionNumber,
      author_id: revision.authorId,
      changed_fields: JSON.stringify([...revision.changedFields]),
      previous_values: JSON.stringify(revision.previousValues),
      new_values: JSON.stringify(revision.newValues),
      change_type: revision.changeType,
      created_at: revision.createdAt.toISOString(),
    };
  }

  static toDomainMany(rows: PowerSyncRuleRevisionRow[]): RuleRevision[] {
    return rows.map((row) => PowerSyncRuleRevisionMapper.toDomain(row));
  }
}
