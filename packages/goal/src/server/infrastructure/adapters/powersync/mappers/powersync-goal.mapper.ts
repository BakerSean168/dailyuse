import type { KeyResultWeightSnapshotDTO, GoalReviewSystemContext } from '@memoflow/contracts/goal';
import { Goal } from '../../../../domain';
import { rawDataToGoalState } from '../../prisma/mappers/goal-state-mapper';
import type {
  RawGoalData,
  RawKeyResultData,
  RawGoalReviewData,
} from '../../prisma/mappers/goal-state-mapper';
export type {
  RawGoalData,
  RawKeyResultData,
  RawGoalReviewData,
} from '../../prisma/mappers/goal-state-mapper';
import { fromDbDateTime } from '../shared';

function requiredMs(value: string | null | undefined): number {
  return (fromDbDateTime(value) ?? new Date()).getTime();
}

function optionalMs(value: string | null | undefined): number | null {
  const d = fromDbDateTime(value);
  return d ? d.getTime() : null;
}

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
      feasibilityAnalysis: row.feasibility_analysis ? String(row.feasibility_analysis) : null,
      motivation: row.motivation ? String(row.motivation) : null,
      status: String(row.status),
      startDate: optionalMs(row.start_date ? String(row.start_date) : null),
      dueDate: optionalMs(row.target_date ? String(row.target_date) : null),
      completedAt: optionalMs(row.completed_at ? String(row.completed_at) : null),
      archivedAt: optionalMs(row.archived_at ? String(row.archived_at) : null),
      sortOrder: Number(row.sort_order ?? 0),
      reminderConfig: row.reminder_config ? JSON.parse(String(row.reminder_config)) : null,
      version: Number(row.version ?? 1),
      createdAt: requiredMs(row.created_at ? String(row.created_at) : null),
      updatedAt: requiredMs(row.updated_at ? String(row.updated_at) : null),
      deletedAt: optionalMs(row.deleted_at ? String(row.deleted_at) : null),
      keyResults: children?.keyResults ?? null,
      goalReviews: children?.goalReviews ?? null,
      weightSnapshots: children?.weightSnapshots ?? null,
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
        startingValue: Number(row.initial_value ?? 0),
        progressBaselineValue: null,
        currentValue: Number(row.current_value ?? 0),
        targetValue: Number(row.target_value ?? 100),
        aggregationMethod: row.aggregation_method ? String(row.aggregation_method) : 'Last',
        unit: row.unit ? String(row.unit) : null,
      },
      weight: Number(row.weight ?? 1),
      sortOrder: Number(row.order ?? 0),
      createdAt: requiredMs(row.created_at ? String(row.created_at) : null),
      updatedAt: requiredMs(row.updated_at ? String(row.updated_at) : null),
    };
  }

  static mapGoalReviewRow(row: Record<string, unknown>): RawGoalReviewData {
    const at = requiredMs(row.created_at ? String(row.created_at) : null);
    let systemContext: GoalReviewSystemContext = {
      windowStartAt: at,
      windowEndAt: at,
      overallProgress: { startPercentage: 0, endPercentage: 0, deltaPercentage: 0 },
      keyResults: [],
      summary: { recordCount: 0, manualRecordCount: 0, taskContributionCount: 0 },
    };
    if (row.lessons_learned) {
      try {
        const parsed = JSON.parse(String(row.lessons_learned));
        if (parsed && typeof parsed === 'object' && 'overallProgress' in parsed) {
          systemContext = parsed as GoalReviewSystemContext;
        }
      } catch {
        // legacy prose is intentionally ignored during the destructive vNext cutover
      }
    }
    return {
      id: String(row.id),
      goalId: String(row.goal_id),
      reflection: row.content ? String(row.content) : '',
      challenges: row.challenges ? String(row.challenges) : null,
      adjustments: row.next_steps ? String(row.next_steps) : null,
      systemContext,
      reviewedAt: at,
      createdAt: at,
      updatedAt: requiredMs(row.updated_at ? String(row.updated_at) : null),
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
      snapshotTime: requiredMs(row.snapshot_time ? String(row.snapshot_time) : null),
      trigger: String(row.trigger) as KeyResultWeightSnapshotDTO['trigger'],
      reason: row.reason ? String(row.reason) : null,
      operatorId: String(row.operator_id) as KeyResultWeightSnapshotDTO['operatorId'],
      createdAt: requiredMs(row.created_at ? String(row.created_at) : null),
    };
  }
}
