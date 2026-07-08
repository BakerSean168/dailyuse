import type { ControlMode, ReminderStatus } from '@dailyuse/contracts/reminder';
import type { IReminderGroupRepository } from '../../../domain/repositories/i-reminder-group-repository';
import { ReminderGroup } from '../../../domain/aggregates/reminder-group';
import {
  PowerSyncReminderGroupMapper,
  type PowerSyncReminderGroupRow,
} from './mappers/powersync-reminder-group.mapper';

type Queryable = {
  getAll<T>(sql: string, parameters?: unknown[]): Promise<T[]>;
  getOptional<T>(sql: string, parameters?: unknown[]): Promise<T | null>;
  get<T>(sql: string, parameters?: unknown[]): Promise<T>;
  execute(sql: string, parameters?: unknown[]): Promise<unknown>;
};

export class ReminderGroupPowerSyncRepository implements IReminderGroupRepository {
  constructor(private readonly db: Queryable) {}

  async save(group: ReminderGroup): Promise<void> {
    const data = PowerSyncReminderGroupMapper.toPersistence(group);
    const existing = await this.db.getOptional<{ id: string }>(
      'SELECT id FROM reminder_groups WHERE id = ? LIMIT 1',
      [data.id],
    );

    if (existing) {
      await this.db.execute(
        `UPDATE reminder_groups
         SET name = ?,
             description = ?,
             color = ?,
             icon = ?,
             control_mode = ?,
             enabled = ?,
             status = ?,
             "order" = ?,
             stats = ?,
             version = ?,
             updated_at = ?,
             deleted_at = ?
         WHERE id = ?`,
        [
          data.name,
          data.description,
          data.color,
          data.icon,
          data.controlMode,
          data.enabled,
          data.status,
          data.order,
          data.stats,
          data.version,
          data.updatedAt,
          data.deletedAt,
          data.id,
        ],
      );
    } else {
      await this.db.execute(
        `INSERT INTO reminder_groups (
          id, identity_id, name, description, color, icon, control_mode, enabled,
           status, "order", stats, version, created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id,
          data.identityId,
          data.name,
          data.description,
          data.color,
          data.icon,
          data.controlMode,
          data.enabled,
          data.status,
          data.order,
          data.stats,
          data.version,
          data.createdAt,
          data.updatedAt,
          data.deletedAt,
        ],
      );
    }
  }

  async findById(id: string): Promise<ReminderGroup | null> {
    const row = await this.db.getOptional<PowerSyncReminderGroupRow>(
      'SELECT * FROM reminder_groups WHERE id = ? LIMIT 1',
      [id],
    );
    return row ? PowerSyncReminderGroupMapper.toDomain(row) : null;
  }

  async findByIdentityId(
    identityId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<ReminderGroup[]> {
    const rows = await this.db.getAll<PowerSyncReminderGroupRow>(
      `SELECT * FROM reminder_groups WHERE identity_id = ?${
        options?.includeDeleted ? '' : ' AND deleted_at IS NULL'
      } ORDER BY "order" ASC`,
      [identityId],
    );
    return rows.map((row) => PowerSyncReminderGroupMapper.toDomain(row));
  }

  async findByControlMode(
    identityId: string,
    controlMode: ControlMode,
    options?: { includeDeleted?: boolean },
  ): Promise<ReminderGroup[]> {
    const rows = await this.db.getAll<PowerSyncReminderGroupRow>(
      `SELECT * FROM reminder_groups WHERE identity_id = ? AND control_mode = ?${
        options?.includeDeleted ? '' : ' AND deleted_at IS NULL'
      } ORDER BY "order" ASC`,
      [identityId, controlMode],
    );
    return rows.map((row) => PowerSyncReminderGroupMapper.toDomain(row));
  }

  async findActive(identityId?: string): Promise<ReminderGroup[]> {
    const rows = await this.db.getAll<PowerSyncReminderGroupRow>(
      `SELECT * FROM reminder_groups WHERE enabled = 1 AND status = 'Active' AND deleted_at IS NULL${
        identityId ? ' AND identity_id = ?' : ''
      } ORDER BY "order" ASC`,
      identityId ? [identityId] : [],
    );
    return rows.map((row) => PowerSyncReminderGroupMapper.toDomain(row));
  }

  async findByIds(ids: string[]): Promise<ReminderGroup[]> {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(', ');
    const rows = await this.db.getAll<PowerSyncReminderGroupRow>(
      `SELECT * FROM reminder_groups WHERE id IN (${placeholders}) ORDER BY "order" ASC`,
      ids,
    );
    const map = new Map(rows.map((row) => [row.id, PowerSyncReminderGroupMapper.toDomain(row)]));
    return ids.map((id) => map.get(id)).filter((item): item is ReminderGroup => !!item);
  }

  async findByName(
    identityId: string,
    name: string,
    excludeId?: string,
  ): Promise<ReminderGroup | null> {
    const row = await this.db.getOptional<PowerSyncReminderGroupRow>(
      `SELECT * FROM reminder_groups WHERE identity_id = ? AND name = ? AND deleted_at IS NULL${
        excludeId ? ' AND id != ?' : ''
      } LIMIT 1`,
      excludeId ? [identityId, name, excludeId] : [identityId, name],
    );
    return row ? PowerSyncReminderGroupMapper.toDomain(row) : null;
  }

  async delete(id: string): Promise<void> {
    await this.db.execute('DELETE FROM reminder_groups WHERE id = ?', [id]);
  }

  async exists(id: string): Promise<boolean> {
    const row = await this.db.getOptional<{ id: string }>(
      'SELECT id FROM reminder_groups WHERE id = ? LIMIT 1',
      [id],
    );
    return !!row;
  }

  async count(
    identityId: string,
    options?: { status?: ReminderStatus; includeDeleted?: boolean },
  ): Promise<number> {
    const clauses = ['identity_id = ?'];
    const params: unknown[] = [identityId];
    if (options?.status) {
      clauses.push('status = ?');
      params.push(options.status);
    }
    if (!options?.includeDeleted) {
      clauses.push('deleted_at IS NULL');
    }
    const result = await this.db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM reminder_groups WHERE ${clauses.join(' AND ')}`,
      params,
    );
    return Number(result.count ?? 0);
  }
}
