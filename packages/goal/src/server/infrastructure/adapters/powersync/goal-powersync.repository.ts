import type { IGoalRepository } from '../../../domain';
import { Goal } from '../../../domain';
import type { KeyResultWeightSnapshotDTO } from '@dailyuse/contracts/goal';
import { AggregateRepositoryBase, createEventBusAdapter } from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils/domain';
import type { GoalPowerSyncDatabase, PowerSyncLockContext } from './shared';
import { toDbDateTime } from './shared';
import { PowerSyncGoalMapper } from './mappers/powersync-goal.mapper';
import type { RawKeyResultData, RawGoalReviewData } from './mappers/powersync-goal.mapper';

const eventBusAdapter = createEventBusAdapter(eventBus);

export class GoalPowerSyncRepository
  extends AggregateRepositoryBase<Goal>
  implements IGoalRepository
{
  constructor(private readonly db: GoalPowerSyncDatabase) {
    super(eventBusAdapter);
  }

    async findById(id: string, options?: { includeChildren?: boolean }): Promise<Goal | null> {
    const row = await this.db.getOptional<Record<string, unknown>>(
      `SELECT * FROM goals WHERE id = ? LIMIT 1`,
      [id],
    );

    if (!row) return null;
    return this.toGoal(row, options?.includeChildren ?? false);
  }

  async findByIdForIdentity(
    identityId: string,
    id: string,
    options?: { includeChildren?: boolean },
  ): Promise<Goal | null> {
    const row = await this.db.getOptional<Record<string, unknown>>(
      `SELECT * FROM goals WHERE id = ? AND identity_id = ? LIMIT 1`,
      [id, identityId],
    );

    if (!row) return null;
    return this.toGoal(row, options?.includeChildren ?? false);
  }

  async findByIdentityId(
    identityId: string,
    options?: {
      includeChildren?: boolean;
      status?: string;
      folderId?: string;
      systemView?: 'active' | 'completed' | 'expired' | 'deleted';
    },
  ): Promise<Goal[]> {
    const params: unknown[] = [identityId];
    const filters = ['g.identity_id = ?'];

    switch (options?.systemView) {
      case 'completed':
        filters.push(
          'g.archived_at IS NOT NULL',
          'g.completed_at IS NOT NULL',
          'g.deleted_at IS NULL',
        );
        break;
      case 'expired':
        filters.push('g.archived_at IS NOT NULL', 'g.completed_at IS NULL', 'g.deleted_at IS NULL');
        break;
      case 'deleted':
        filters.push('g.deleted_at IS NOT NULL');
        break;
      case 'active':
      default:
        filters.push('g.archived_at IS NULL', 'g.deleted_at IS NULL');
        break;
    }

    if (options?.status) {
      filters.push('g.status = ?');
      params.push(options.status);
    }

    if (options?.folderId) {
      filters.push('g.folder_id = ?');
      params.push(options.folderId);
    }

    const rows = await this.db.getAll<Record<string, unknown>>(
      `SELECT
         g.*,
         (
           SELECT COUNT(*)
           FROM key_results kr
           WHERE kr.goal_id = g.id AND kr.deleted_at IS NULL
         ) AS total_key_results,
         (
           SELECT COUNT(*)
           FROM key_results kr
           WHERE kr.goal_id = g.id
             AND kr.deleted_at IS NULL
             AND COALESCE(kr.current_value, 0) >= COALESCE(kr.target_value, 0)
         ) AS completed_key_results
       FROM goals g
       WHERE ${filters.join(' AND ')}
       ORDER BY g.sort_order ASC, g.created_at DESC`,
      params,
    );

    const includeChildren = options?.includeChildren ?? false;
    return Promise.all(rows.map((row) => this.toGoal(row, includeChildren)));
  }

  async findByFolderId(identityId: string, folderId: string): Promise<Goal[]> {
    const rows = await this.db.getAll<Record<string, unknown>>(
      `SELECT *
        FROM goals
        WHERE identity_id = ?
          AND folder_id = ?
          AND deleted_at IS NULL
          AND archived_at IS NULL
        ORDER BY sort_order ASC, created_at DESC`,
      [identityId, folderId],
    );

    return Promise.all(rows.map((row) => this.toGoal(row, false)));
  }

  protected async persist(goal: Goal): Promise<void> {
    const dto = goal.toServerDTO(true);

    await this.db.writeTransaction(async (tx) => {
      const existingGoal = await tx.getOptional<{ id: string }>(
        `SELECT id FROM goals WHERE id = ? LIMIT 1`,
        [dto.id],
      );

      if (existingGoal) {
        await tx.execute(
          `UPDATE goals
           SET identity_id = ?,
               name = ?,
               description = ?,
               color = ?,
               feasibility_analysis = ?,
               motivation = ?,
               status = ?,
               importance = ?,
               priority = ?,
               category = ?,
               tags = ?,
               start_date = ?,
               target_date = ?,
               completed_at = ?,
               archived_at = ?,
               folder_id = ?,
               parent_goal_id = ?,
               sort_order = ?,
               reminder_config = ?,
               version = ?,
               updated_at = ?,
               deleted_at = ?
           WHERE id = ?`,
          [
            dto.identityId,
            dto.name,
            dto.description,
            dto.color,
            dto.feasibilityAnalysis,
            dto.motivation,
            dto.status,
            dto.importance,
            dto.priority ?? 0,
            dto.category,
            JSON.stringify(dto.tags ?? []),
            toDbDateTime(dto.startDate),
            toDbDateTime(dto.targetDate),
            toDbDateTime(dto.completedAt),
            toDbDateTime(dto.archivedAt),
            dto.folderId,
            dto.parentGoalId,
            dto.sortOrder,
            dto.reminderConfig ? JSON.stringify(dto.reminderConfig) : null,
            dto.version,
            toDbDateTime(dto.updatedAt),
            toDbDateTime(dto.deletedAt),
            dto.id,
          ],
        );
      } else {
        await tx.execute(
          `INSERT INTO goals (
             id, identity_id, name, description, color, feasibility_analysis,
             motivation, status, importance, priority, category, tags,
             start_date, target_date, completed_at, archived_at,
             folder_id, parent_goal_id, sort_order, reminder_config,
             version, created_at, updated_at, deleted_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            dto.id,
            dto.identityId,
            dto.name,
            dto.description,
            dto.color,
            dto.feasibilityAnalysis,
            dto.motivation,
            dto.status,
            dto.importance,
            dto.priority ?? 0,
            dto.category,
            JSON.stringify(dto.tags ?? []),
            toDbDateTime(dto.startDate),
            toDbDateTime(dto.targetDate),
            toDbDateTime(dto.completedAt),
            toDbDateTime(dto.archivedAt),
            dto.folderId,
            dto.parentGoalId,
            dto.sortOrder,
            dto.reminderConfig ? JSON.stringify(dto.reminderConfig) : null,
            dto.version,
            toDbDateTime(dto.createdAt),
            toDbDateTime(dto.updatedAt),
            toDbDateTime(dto.deletedAt),
          ],
        );
      }

      await this.syncKeyResults(
        tx,
        dto.id as string,
        dto.identityId as string,
        dto.keyResults ?? [],
      );
      await this.syncGoalReviews(
        tx,
        dto.id as string,
        dto.identityId as string,
        dto.goalReviews ?? [],
      );
      await this.syncWeightSnapshots(
        tx,
        dto.id as string,
        dto.identityId as string,
        dto.weightSnapshots ?? [],
      );
    });
  }

  async delete(identityId: string, id: string): Promise<void> {
    const existing = await this.findByIdForIdentity(identityId, id);
    if (!existing) {
      throw new Error('Goal not found for the current identity.');
    }
    await this.db.writeTransaction(async (tx) => {
      await tx.execute(`DELETE FROM goal_reviews WHERE goal_id = ?`, [id]);
      await tx.execute(
        `DELETE FROM goal_records
         WHERE key_result_id IN (SELECT id FROM key_results WHERE goal_id = ?)`,
        [id],
      );
      await tx.execute(`DELETE FROM key_results WHERE goal_id = ?`, [id]);
      await tx.execute(`DELETE FROM key_result_weight_snapshots WHERE goal_id = ?`, [id]);
      await tx.execute(`DELETE FROM goals WHERE id = ? AND identity_id = ?`, [id, identityId]);
    });
  }

  async exists(identityId: string, id: string): Promise<boolean> {
    return (await this.findByIdForIdentity(identityId, id)) !== null;
  }

  async batchUpdateStatus(identityId: string, ids: string[], status: string): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(', ');
    await this.db.execute(
      `UPDATE goals SET status = ?, updated_at = ? WHERE identity_id = ? AND id IN (${placeholders})`,
      [status, toDbDateTime(new Date()), identityId, ...ids],
    );
  }

  async batchMoveToFolder(ids: string[], folderId: string | null): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(', ');
    await this.db.execute(
      `UPDATE goals SET folder_id = ?, updated_at = ? WHERE id IN (${placeholders})`,
      [folderId, toDbDateTime(new Date()), ...ids],
    );
  }

  async isAncestor(potentialAncestorId: string, potentialDescendantId: string): Promise<boolean> {
    let currentId: string | null = potentialDescendantId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === potentialAncestorId) return true;
      if (visited.has(currentId)) return false;
      visited.add(currentId);

      const parentRow: { parent_goal_id: string | null } | null = await this.db.getOptional(
        `SELECT parent_goal_id FROM goals WHERE id = ? LIMIT 1`,
        [currentId],
      );
      currentId = parentRow?.parent_goal_id ?? null;
    }

    return false;
  }

  async findChildren(parentId: string): Promise<Goal[]> {
    const rows = await this.db.getAll<Record<string, unknown>>(
      `SELECT *
       FROM goals
       WHERE parent_goal_id = ?
         AND deleted_at IS NULL
       ORDER BY sort_order ASC`,
      [parentId],
    );

    return Promise.all(rows.map((row) => this.toGoal(row, false)));
  }

  private async toGoal(row: Record<string, unknown>, includeChildren: boolean): Promise<Goal> {
    const children = includeChildren
      ? {
          keyResults: await this.loadKeyResults(String(row.id)),
          goalReviews: await this.loadGoalReviews(String(row.id)),
          weightSnapshots: await this.loadWeightSnapshots(String(row.id)),
        }
      : undefined;

    return PowerSyncGoalMapper.toDomain(row, children);
  }

  private async loadKeyResults(goalId: string): Promise<RawKeyResultData[]> {
    const rows = await this.db.getAll<Record<string, unknown>>(
      `SELECT *
       FROM key_results
       WHERE goal_id = ?
         AND deleted_at IS NULL
       ORDER BY "order" ASC`,
      [goalId],
    );

    return rows.map((row) => PowerSyncGoalMapper.mapKeyResultRow(row));
  }

  private async loadGoalReviews(goalId: string): Promise<RawGoalReviewData[]> {
    const rows = await this.db.getAll<Record<string, unknown>>(
      `SELECT *
       FROM goal_reviews
       WHERE goal_id = ?
         AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [goalId],
    );

    return rows.map((row) => PowerSyncGoalMapper.mapGoalReviewRow(row));
  }

  private async loadWeightSnapshots(goalId: string): Promise<KeyResultWeightSnapshotDTO[]> {
    const rows = await this.db.getAll<Record<string, unknown>>(
      `SELECT *
       FROM key_result_weight_snapshots
       WHERE goal_id = ?
       ORDER BY snapshot_time DESC`,
      [goalId],
    );

    return rows.map((row) => PowerSyncGoalMapper.mapWeightSnapshotRow(row));
  }

  private async syncKeyResults(
    tx: PowerSyncLockContext,
    goalId: string,
    identityId: string,
    keyResults: NonNullable<ReturnType<Goal['toServerDTO']>['keyResults']>,
  ): Promise<void> {
    const ids = keyResults.map((kr) => String(kr.id));

    if (ids.length > 0) {
      const placeholders = ids.map(() => '?').join(', ');
      await tx.execute(
        `DELETE FROM goal_records
         WHERE key_result_id IN (
           SELECT id FROM key_results WHERE goal_id = ? AND id NOT IN (${placeholders})
         )`,
        [goalId, ...ids],
      );
      await tx.execute(
        `DELETE FROM key_results WHERE goal_id = ? AND id NOT IN (${placeholders})`,
        [goalId, ...ids],
      );
    } else {
      await tx.execute(
        `DELETE FROM goal_records WHERE key_result_id IN (SELECT id FROM key_results WHERE goal_id = ?)`,
        [goalId],
      );
      await tx.execute(`DELETE FROM key_results WHERE goal_id = ?`, [goalId]);
    }

    for (const keyResult of keyResults) {
      const progress =
        typeof keyResult.progress === 'string'
          ? JSON.parse(keyResult.progress)
          : keyResult.progress;

      const existingKeyResult = await tx.getOptional<{ id: string }>(
        `SELECT id FROM key_results WHERE id = ? LIMIT 1`,
        [keyResult.id],
      );

      if (existingKeyResult) {
        await tx.execute(
          `UPDATE key_results
           SET identity_id = ?,
               goal_id = ?,
               title = ?,
               description = ?,
               value_type = ?,
               aggregation_method = ?,
               initial_value = ?,
               target_value = ?,
               current_value = ?,
               unit = ?,
               weight = ?,
               "order" = ?,
               version = ?,
               updated_at = ?,
               deleted_at = ?
           WHERE id = ?`,
          [
            identityId,
            goalId,
            keyResult.title,
            keyResult.description,
            progress.valueType ?? 'Incremental',
            progress.aggregationMethod ?? 'Last',
            progress.initialValue ?? 0,
            progress.targetValue ?? 100,
            progress.currentValue ?? 0,
            progress.unit ?? null,
            keyResult.weight,
            keyResult.sortOrder,
            keyResult.version,
            toDbDateTime(keyResult.updatedAt),
            toDbDateTime(keyResult.deletedAt),
            keyResult.id,
          ],
        );
      } else {
        await tx.execute(
          `INSERT INTO key_results (
             id, identity_id, goal_id, title, description,
             value_type, aggregation_method, initial_value, target_value, current_value,
             unit, weight, "order", version, created_at, updated_at, deleted_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            keyResult.id,
            identityId,
            goalId,
            keyResult.title,
            keyResult.description,
            progress.valueType ?? 'Incremental',
            progress.aggregationMethod ?? 'Last',
            progress.initialValue ?? 0,
            progress.targetValue ?? 100,
            progress.currentValue ?? 0,
            progress.unit ?? null,
            keyResult.weight,
            keyResult.sortOrder,
            keyResult.version,
            toDbDateTime(keyResult.createdAt),
            toDbDateTime(keyResult.updatedAt),
            toDbDateTime(keyResult.deletedAt),
          ],
        );
      }
    }
  }

  private async syncGoalReviews(
    tx: PowerSyncLockContext,
    goalId: string,
    identityId: string,
    goalReviews: NonNullable<ReturnType<Goal['toServerDTO']>['goalReviews']>,
  ): Promise<void> {
    const ids = goalReviews.map((review) => String(review.id));

    if (ids.length > 0) {
      const placeholders = ids.map(() => '?').join(', ');
      await tx.execute(
        `DELETE FROM goal_reviews WHERE goal_id = ? AND id NOT IN (${placeholders})`,
        [goalId, ...ids],
      );
    } else {
      await tx.execute(`DELETE FROM goal_reviews WHERE goal_id = ?`, [goalId]);
    }

    for (const review of goalReviews) {
      const existingReview = await tx.getOptional<{ id: string }>(
        `SELECT id FROM goal_reviews WHERE id = ? LIMIT 1`,
        [review.id],
      );

      if (existingReview) {
        await tx.execute(
          `UPDATE goal_reviews
           SET identity_id = ?,
               goal_id = ?,
               review_type = ?,
               content = ?,
               achievements = ?,
               challenges = ?,
               lessons_learned = ?,
               next_steps = ?,
               rating = ?,
               version = ?,
               updated_at = ?,
               deleted_at = ?
           WHERE id = ?`,
          [
            identityId,
            goalId,
            review.type,
            review.summary,
            review.achievements,
            review.challenges,
            review.improvements,
            null,
            review.rating,
            review.version,
            toDbDateTime(review.updatedAt),
            toDbDateTime(review.deletedAt),
            review.id,
          ],
        );
      } else {
        await tx.execute(
          `INSERT INTO goal_reviews (
             id, identity_id, goal_id, review_type, content, achievements,
             challenges, lessons_learned, next_steps, rating, version,
             created_at, updated_at, deleted_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            review.id,
            identityId,
            goalId,
            review.type,
            review.summary,
            review.achievements,
            review.challenges,
            review.improvements,
            null,
            review.rating,
            review.version,
            toDbDateTime(review.createdAt),
            toDbDateTime(review.updatedAt),
            toDbDateTime(review.deletedAt),
          ],
        );
      }
    }
  }

  private async syncWeightSnapshots(
    tx: PowerSyncLockContext,
    goalId: string,
    identityId: string,
    weightSnapshots: NonNullable<ReturnType<Goal['toServerDTO']>['weightSnapshots']>,
  ): Promise<void> {
    for (const snapshot of weightSnapshots) {
      await tx.execute(
        `INSERT OR IGNORE INTO key_result_weight_snapshots (
           id, identity_id, goal_id, key_result_id, old_weight, new_weight,
           weight_delta, snapshot_time, trigger, reason, operator_id, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          snapshot.id,
          snapshot.identityId ?? identityId,
          goalId,
          snapshot.keyResultId,
          snapshot.oldWeight,
          snapshot.newWeight,
          snapshot.weightDelta,
          toDbDateTime(snapshot.snapshotTime),
          snapshot.trigger,
          snapshot.reason,
          snapshot.operatorId,
          toDbDateTime(snapshot.createdAt),
        ],
      );
    }
  }
}
