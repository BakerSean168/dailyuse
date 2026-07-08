import type { ReviewType, KeyResultWeightSnapshotDTO } from '@dailyuse/contracts/goal';
import { Goal } from '../../../../domain';
import { rawDataToGoalState } from '../../prisma/mappers/goal-state-mapper';
import type { RawGoalData, RawKeyResultData, RawGoalReviewData } from '../../prisma/mappers/goal-state-mapper';
export type { RawGoalData, RawKeyResultData, RawGoalReviewData } from '../../prisma/mappers/goal-state-mapper';
import { fromDbDateTime, parseJsonArray } from '../shared';

export class PowerSyncGoalMapper {
  static toDomain(
    row: Record<string, unknown>,
    children?: {
      keyResults?: RawKeyResultData[] | null;
      goalReviews?: RawGoalReviewData[] | null;
      weightSnapshots?: KeyResultWeightSnapshotDTO[] | null;
    },
  ): Goal {
    const raw: RawGoalData = {
      id: String(row.id),
      identityId: String(row.identity_id),
      name: String(row.name),
      description: row.description ? String(row.description) : null,
      color: row.color ? String(row.color) : '#3B82F6',
      feasibilityAnalysis: row.feasibility_analysis ? String(row.feasibility_analysis) : null,
      motivation: row.motivation ? String(row.motivation) : null,
      status: String(row.status),
      importance: String(row.importance),
      priority: Number(row.priority ?? 0),
      category: row.category ? String(row.category) : null,
      tags: parseJsonArray(row.tags),
      startDate: fromDbDateTime(row.start_date ? String(row.start_date) : null),
      targetDate: fromDbDateTime(row.target_date ? String(row.target_date) : null),
      completedAt: fromDbDateTime(row.completed_at ? String(row.completed_at) : null),
      archivedAt: fromDbDateTime(row.archived_at ? String(row.archived_at) : null),
      folderId: row.folder_id ? String(row.folder_id) : null,
      parentGoalId: row.parent_goal_id ? String(row.parent_goal_id) : null,
      sortOrder: Number(row.sort_order ?? 0),
      reminderConfig: row.reminder_config
        ? JSON.parse(String(row.reminder_config))
        : null,
      version: Number(row.version ?? 1),
      createdAt: fromDbDateTime(String(row.created_at)) ?? new Date(),
      updatedAt: fromDbDateTime(String(row.updated_at)) ?? new Date(),
      deletedAt: fromDbDateTime(row.deleted_at ? String(row.deleted_at) : null),
      keyResults: children?.keyResults ?? null,
      goalReviews: children?.goalReviews ?? null,
      weightSnapshots: children?.weightSnapshots ?? null,
      totalKeyResults:
        row.total_key_results === undefined || row.total_key_results === null
          ? undefined
          : Number(row.total_key_results),
      completedKeyResults:
        row.completed_key_results === undefined || row.completed_key_results === null
          ? undefined
          : Number(row.completed_key_results),
    };

    return Goal.load(rawDataToGoalState(raw));
  }

  static mapKeyResultRow(row: Record<string, unknown>): RawKeyResultData {
    return {
      id: String(row.id),
      goalId: String(row.goal_id),
      title: String(row.title),
      description: row.description ? String(row.description) : null,
      progress: {
        initialValue: Number(row.initial_value ?? 0),
        currentValue: Number(row.current_value ?? 0),
        targetValue: Number(row.target_value ?? 100),
        valueType: row.value_type ? String(row.value_type) : 'Incremental',
        aggregationMethod: row.aggregation_method ? String(row.aggregation_method) : 'Last',
        unit: row.unit ? String(row.unit) : null,
      },
      weight: Number(row.weight ?? 1),
      sortOrder: Number(row.order ?? 0),
      version: Number(row.version ?? 1),
      createdAt: fromDbDateTime(String(row.created_at)) ?? new Date(),
      updatedAt: fromDbDateTime(String(row.updated_at)) ?? new Date(),
      deletedAt: fromDbDateTime(row.deleted_at ? String(row.deleted_at) : null),
    };
  }

  static mapGoalReviewRow(row: Record<string, unknown>): RawGoalReviewData {
    return {
      id: String(row.id),
      goalId: String(row.goal_id),
      type: String(row.review_type) as ReviewType,
      rating: Number(row.rating ?? 3),
      summary: row.content ? String(row.content) : '',
      achievements: row.achievements ? String(row.achievements) : null,
      challenges: row.challenges ? String(row.challenges) : null,
      improvements: row.lessons_learned ? String(row.lessons_learned) : null,
      keyResultSnapshots: [],
      reviewedAt:
        fromDbDateTime(row.updated_at ? String(row.updated_at) : null) ??
        fromDbDateTime(row.created_at ? String(row.created_at) : null) ??
        new Date(),
      version: Number(row.version ?? 1),
      createdAt: fromDbDateTime(String(row.created_at)) ?? new Date(),
      updatedAt: fromDbDateTime(String(row.updated_at)) ?? new Date(),
      deletedAt: fromDbDateTime(row.deleted_at ? String(row.deleted_at) : null),
    };
  }

  static mapWeightSnapshotRow(row: Record<string, unknown>): KeyResultWeightSnapshotDTO {
    return {
      id: String(row.id) as KeyResultWeightSnapshotDTO['id'],
      goalId: String(row.goal_id) as KeyResultWeightSnapshotDTO['goalId'],
      keyResultId: String(row.key_result_id) as KeyResultWeightSnapshotDTO['keyResultId'],
      identityId: String(row.identity_id) as KeyResultWeightSnapshotDTO['identityId'],
      oldWeight: Number(row.old_weight),
      newWeight: Number(row.new_weight),
      weightDelta: Number(row.weight_delta),
      snapshotTime: (fromDbDateTime(String(row.snapshot_time)) ?? new Date()).getTime(),
      trigger: String(row.trigger) as KeyResultWeightSnapshotDTO['trigger'],
      reason: row.reason ? String(row.reason) : null,
      operatorId: String(row.operator_id) as KeyResultWeightSnapshotDTO['operatorId'],
      createdAt: (fromDbDateTime(String(row.created_at)) ?? new Date()).getTime(),
    };
  }
}
