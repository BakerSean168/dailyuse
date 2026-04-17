import type { FocusModePersistenceDTO } from '@dailyuse/contracts/goal';
import { FocusMode } from '@/domain-server';
import { FocusModeId } from '@/domain-shared';
import { fromDbDateTime, parseJsonArray } from '../shared';

export class PowerSyncFocusModeMapper {
  static toDomain(row: Record<string, unknown>): FocusMode {
    return FocusMode.fromPersistenceDTO({
      id: FocusModeId.of(String(row.id)),
      identityId: String(row.identity_id) as FocusModePersistenceDTO['identityId'],
      focusedGoalIds: parseJsonArray(
        row.focused_goal_ids,
      ) as FocusModePersistenceDTO['focusedGoalIds'],
      startTime: fromDbDateTime(String(row.start_time)) ?? new Date(),
      endTime: fromDbDateTime(String(row.end_time)) ?? new Date(),
      hiddenGoalsMode: String(row.hidden_goals_mode),
      isActive: Boolean(row.is_active ?? 0),
      actualEndTime: fromDbDateTime(row.actual_end_time ? String(row.actual_end_time) : null),
      version: Number(row.version ?? 1),
      createdAt: fromDbDateTime(String(row.created_at)) ?? new Date(),
      updatedAt: fromDbDateTime(String(row.updated_at)) ?? new Date(),
      deletedAt: fromDbDateTime(row.deleted_at ? String(row.deleted_at) : null),
    });
  }
}
