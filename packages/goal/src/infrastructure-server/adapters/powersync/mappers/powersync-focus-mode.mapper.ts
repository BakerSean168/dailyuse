import { FocusMode } from '@/domain-server';
import { FocusModeId, GoalId, HiddenGoalsMode } from '@/domain-shared';
import { IdentityId } from '@dailyuse/domain-shared';
import { fromDbDateTime, parseJsonArray } from '../shared';

export class PowerSyncFocusModeMapper {
  static toDomain(row: Record<string, unknown>): FocusMode {
    return FocusMode.fromDTO({
      id: FocusModeId.of(String(row.id)),
      identityId: IdentityId.of(String(row.identity_id)),
      focusedGoalIds: parseJsonArray(row.focused_goal_ids).map((id) => GoalId.of(String(id))),
      startTime: (fromDbDateTime(String(row.start_time)) ?? new Date()).getTime(),
      endTime: (fromDbDateTime(String(row.end_time)) ?? new Date()).getTime(),
      hiddenGoalsMode: HiddenGoalsMode.of(String(row.hidden_goals_mode)),
      isActive: Boolean(row.is_active ?? 0),
      actualEndTime: row.actual_end_time
        ? (fromDbDateTime(String(row.actual_end_time)) ?? new Date()).getTime()
        : null,
      createdAt: (fromDbDateTime(String(row.created_at)) ?? new Date()).getTime(),
      updatedAt: (fromDbDateTime(String(row.updated_at)) ?? new Date()).getTime(),
    });
  }
}
