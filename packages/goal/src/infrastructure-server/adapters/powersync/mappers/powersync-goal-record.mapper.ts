import { GoalRecord } from '@/domain-server';
import { GoalRecordId, KeyResultId } from '@/domain-shared';
import { IdentityId } from '@dailyuse/domain-shared';
import { fromDbDateTime } from '../shared';

export class PowerSyncGoalRecordMapper {
  static toDomain(row: Record<string, unknown>): GoalRecord {
    return GoalRecord.load({
      id: GoalRecordId.of(String(row.id)),
      keyResultId: KeyResultId.of(String(row.key_result_id)),
      identityId: IdentityId.of(String(row.identity_id)),
      value: Number(row.value ?? 0),
      note: row.note ? String(row.note) : null,
      recordedAt: fromDbDateTime(String(row.recorded_at)) ?? new Date(),
      version: Number(row.version ?? 1),
      createdAt: fromDbDateTime(String(row.created_at)) ?? new Date(),
      updatedAt: fromDbDateTime(String(row.updated_at)) ?? new Date(),
      deletedAt: fromDbDateTime(row.deleted_at ? String(row.deleted_at) : null),
    });
  }
}
