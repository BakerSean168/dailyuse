import { GoalVersionConflictError, type IGoalRepository } from '../../../domain';
import { Goal } from '../../../domain';
import type { KeyResultWeightSnapshotDTO } from '@memoflow/contracts/goal';
import {
  AggregateRepositoryBase,
  createEventBusAdapter,
  publishAggregateEvents,
  type IEventBus,
} from '@memoflow/patterns';
import { eventBus } from '@memoflow/utils/domain';
import type { GoalPowerSyncDatabase, PowerSyncLockContext } from './shared';
import { toDbDateTime } from './shared';
import { PowerSyncGoalMapper } from './mappers/powersync-goal.mapper';
import type { RawKeyResultData, RawGoalReviewData } from './mappers/powersync-goal.mapper';

const eventBusAdapter = createEventBusAdapter(eventBus);

export class GoalPowerSyncRepository
  extends AggregateRepositoryBase<Goal>
  implements IGoalRepository
{
  constructor(
    private readonly db: GoalPowerSyncDatabase | PowerSyncLockContext,
    eventBus: IEventBus = eventBusAdapter,
    private readonly transactionBound = false,
  ) {
    super(eventBus);
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
      `SELECT g.*
       FROM goals g
       WHERE ${filters.join(' AND ')}
       ORDER BY g.sort_order ASC, g.created_at DESC`,
      params,
    );

    // Keep aggregate-derived counts/progress authoritative on both adapters.
    return Promise.all(rows.map((row) => this.toGoal(row, true)));
  }

  async findByKeyResultIdForIdentity(
    identityId: string,
    keyResultId: string,
  ): Promise<Goal | null> {
    const row = await this.db.getOptional<{ goal_id: string }>(
      `SELECT goal_id FROM key_results WHERE id = ? LIMIT 1`,
      [keyResultId],
    );
    return row
      ? this.findByIdForIdentity(identityId, row.goal_id, { includeChildren: true })
      : null;
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

    const persistInTransaction = async (tx: PowerSyncLockContext) => {
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
    };

    if (this.transactionBound) {
      await persistInTransaction(this.db as PowerSyncLockContext);
      return;
    }

    await (this.db as GoalPowerSyncDatabase).writeTransaction(persistInTransaction);
  }

  async saveRootWithExpectedVersion(goal: Goal, expectedVersion: number): Promise<void> {
    if (!this.transactionBound) {
      await (this.db as GoalPowerSyncDatabase).writeTransaction(async (tx) => {
        const repository = new GoalPowerSyncRepository(tx, this.eventBus, true);
        await repository.persistWithExpectedVersion(goal, expectedVersion);
      });
      await publishAggregateEvents(goal, this.eventBus);
      return;
    }

    await this.persistWithExpectedVersion(goal, expectedVersion);
    await publishAggregateEvents(goal, this.eventBus);
  }

  private async persistWithExpectedVersion(goal: Goal, expectedVersion: number): Promise<void> {
    const dto = goal.toServerDTO(false);
    const result = await this.db.execute(
      `UPDATE goals SET name = ?, description = ?, color = ?, feasibility_analysis = ?, motivation = ?,
       status = ?, importance = ?, priority = ?, category = ?, tags = ?, start_date = ?, target_date = ?,
       folder_id = ?, parent_goal_id = ?, reminder_config = ?, version = ?, updated_at = ?
       WHERE id = ? AND identity_id = ? AND version = ?`,
      [
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
        dto.folderId,
        dto.parentGoalId,
        dto.reminderConfig ? JSON.stringify(dto.reminderConfig) : null,
        dto.version,
        toDbDateTime(dto.updatedAt),
        dto.id,
        dto.identityId,
        expectedVersion,
      ],
    );
    if (result.rowsAffected !== 1) throw new GoalVersionConflictError();
    await this.persist(goal);
  }

  async delete(identityId: string, id: string): Promise<void> {
    const existing = await this.findByIdForIdentity(identityId, id);
    if (!existing) {
      throw new Error('Goal not found for the current identity.');
    }
    await (this.db as GoalPowerSyncDatabase).writeTransaction(async (tx) => {
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

  async deleteWithExpectedVersion(
    identityId: string,
    id: string,
    expectedVersion: number,
  ): Promise<void> {
    await (this.db as GoalPowerSyncDatabase).writeTransaction(async (tx) => {
      await tx.execute(`DELETE FROM goal_reviews WHERE goal_id = ?`, [id]);
      await tx.execute(
        `DELETE FROM goal_records
         WHERE key_result_id IN (SELECT id FROM key_results WHERE goal_id = ?)`,
        [id],
      );
      await tx.execute(`DELETE FROM key_results WHERE goal_id = ?`, [id]);
      await tx.execute(`DELETE FROM key_result_weight_snapshots WHERE goal_id = ?`, [id]);
      const deleted = await tx.execute(
        `DELETE FROM goals WHERE id = ? AND identity_id = ? AND version = ?`,
        [id, identityId, expectedVersion],
      );
      if (deleted.rowsAffected !== 1) throw new GoalVersionConflictError();
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

  async batchMoveToFolder(
    identityId: string,
    ids: string[],
    folderId: string | null,
  ): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(', ');
    await this.db.execute(
      `UPDATE goals SET folder_id = ?, updated_at = ? WHERE identity_id = ? AND id IN (${placeholders})`,
      [folderId, toDbDateTime(new Date()), identityId, ...ids],
    );
  }

  async isAncestor(
    identityId: string,
    potentialAncestorId: string,
    potentialDescendantId: string,
  ): Promise<boolean> {
    let currentId: string | null = potentialDescendantId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === potentialAncestorId) return true;
      if (visited.has(currentId)) return false;
      visited.add(currentId);

      const parentRow: { parent_goal_id: string | null } | null = await this.db.getOptional(
        `SELECT parent_goal_id FROM goals WHERE id = ? AND identity_id = ? LIMIT 1`,
        [currentId, identityId],
      );
      currentId = parentRow?.parent_goal_id ?? null;
    }

    return false;
  }

  async findChildren(identityId: string, parentId: string): Promise<Goal[]> {
    const rows = await this.db.getAll<Record<string, unknown>>(
      `SELECT *
       FROM goals
       WHERE parent_goal_id = ?
         AND identity_id = ?
         AND deleted_at IS NULL
       ORDER BY sort_order ASC`,
      [parentId, identityId],
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
               updated_at = ?
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
            toDbDateTime(keyResult.updatedAt),
            keyResult.id,
          ],
        );
      } else {
        await tx.execute(
          `INSERT INTO key_results (
             id, identity_id, goal_id, title, description,
             value_type, aggregation_method, initial_value, target_value, current_value,
             unit, weight, "order", created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            toDbDateTime(keyResult.createdAt),
            toDbDateTime(keyResult.updatedAt),
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
               updated_at = ?
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
            toDbDateTime(review.updatedAt),
            review.id,
          ],
        );
      } else {
        await tx.execute(
          `INSERT INTO goal_reviews (
             id, identity_id, goal_id, review_type, content, achievements,
             challenges, lessons_learned, next_steps, rating,
             created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            toDbDateTime(review.createdAt),
            toDbDateTime(review.updatedAt),
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
