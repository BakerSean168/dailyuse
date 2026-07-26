import { GoalRecord } from '../../../../domain';
import { GoalRecordId, KeyResultId } from '../../../../domain';
import { IdentityId } from '@dailyuse/domain-shared';
import { fromDbDateTime } from '../shared';

function requiredMs(value: string | null | undefined): number {
  return (fromDbDateTime(value) ?? new Date()).getTime();
}

function optionalMs(value: string | null | undefined): number | null {
  const d = fromDbDateTime(value);
  return d ? d.getTime() : null;
}

export class PowerSyncGoalRecordMapper {
  static toDomain(row: Record<string, unknown>): GoalRecord {
    return GoalRecord.load({
      id: GoalRecordId.of(String(row.id)),
      keyResultId: KeyResultId.of(String(row.key_result_id)),
      identityId: IdentityId.of(String(row.identity_id)),
      value: Number(row.value ?? 0),
      note: row.note ? String(row.note) : null,
      recordedAt: requiredMs(row.recorded_at ? String(row.recorded_at) : null),
      version: Number(row.version ?? 1),
      createdAt: requiredMs(row.created_at ? String(row.created_at) : null),
      updatedAt: requiredMs(row.updated_at ? String(row.updated_at) : null),
      deletedAt: optionalMs(row.deleted_at ? String(row.deleted_at) : null),
    });
  }
}
