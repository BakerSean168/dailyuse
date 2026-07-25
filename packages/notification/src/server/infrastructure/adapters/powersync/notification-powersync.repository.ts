import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type {
  NotificationCategory,
  NotificationEventMap,
  NotificationServerDTO,
  NotificationStatus,
  NotificationType,
} from '@dailyuse/contracts/notification';
import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import type { INotificationRepository } from '../../../domain/repositories/i-notification-repository';
import { Notification } from '../../../domain/aggregates/notification';
import { NotificationId, NotificationAction, NotificationMetadata } from '../../../domain/value-objects';
import { createTypedEventPublisher, eventBus, flushDomainEvents } from '@dailyuse/utils/domain';
// Residual 1025: sole parseJsonSafe (local dual retired).
import { parseJsonSafe } from '@dailyuse/utils/shared';

const notificationEventPublisher = createTypedEventPublisher<NotificationEventMap>(eventBus);

interface NotificationRow {
  id: string;
  identity_id: string;
  title: string;
  content: string;
  type: string;
  category: string;
  importance: string | null;
  status: string;
  is_read: number | null;
  read_at: string | null;
  metadata: string | null;
  actions: string | null;
  expires_at: string | null;
  version: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Residual 1101 keep-boundary: PowerSync row ISO string → number|null (empty/invalid → null).
// Soft residual 1101: projection unknown→undefined and AI positive-only keep-boundaries (no force-merge).
// Soft residual 1141: auth PowerSync toMillis (same string→null shape; co-located; no force-merge).
function toTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}


function toServerDTO(row: NotificationRow): NotificationServerDTO {
  return {
    id: row.id as NotificationServerDTO['id'],
    identityId: row.identity_id as NotificationServerDTO['identityId'],
    title: row.title,
    content: row.content,
    type: row.type as NotificationType,
    category: row.category as NotificationCategory,
    importance: (row.importance ?? 'Moderate') as ImportanceLevel,
    status: row.status as NotificationStatus,
    isRead: Boolean(row.is_read ?? 0),
    readAt: toTimestamp(row.read_at),
    actions: parseJsonSafe<NotificationServerDTO['actions']>(row.actions),
    metadata: parseJsonSafe<NotificationServerDTO['metadata']>(row.metadata),
    expiresAt: toTimestamp(row.expires_at),
    version: row.version ?? 1,
    createdAt: toTimestamp(row.created_at) ?? Date.now(),
    updatedAt: toTimestamp(row.updated_at) ?? Date.now(),
    deletedAt: toTimestamp(row.deleted_at),
    notificationChannels: null,
  };
}

function hydrateNotification(row: NotificationRow): Notification {
  const dto = toServerDTO(row);

  return Notification.load({
    id: NotificationId.of(String(dto.id)),
    identityId: dto.identityId,
    title: dto.title,
    content: dto.content,
    type: dto.type,
    category: dto.category,
    importance: dto.importance,
    status: dto.status,
    isRead: dto.isRead,
    readAt: dto.readAt ?? null,
    actions: dto.actions?.map((action) => NotificationAction.fromDTO(action)) ?? null,
    metadata: dto.metadata ? NotificationMetadata.fromDTO(dto.metadata) : null,
    expiresAt: dto.expiresAt ?? null,
    version: dto.version,
    deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    notificationChannels: [],
  });
}

export class PowerSyncNotificationRepository implements INotificationRepository {
  constructor(private readonly db: IElectronDatabase) {}

  async save(notification: Notification): Promise<void> {
    const dto = notification.toServerDTO();
    const existing = await this.db.getOptional<{ id: string }>(
      `SELECT id FROM notifications WHERE id = ? LIMIT 1`,
      [dto.id],
    );

    if (existing) {
      await this.db.execute(
        `UPDATE notifications
            SET identity_id = ?,
                title = ?,
                content = ?,
                type = ?,
                category = ?,
                importance = ?,
                urgency = ?,
                status = ?,
                is_read = ?,
                read_at = ?,
                related_entity_type = ?,
                related_entity_id = ?,
                metadata = ?,
                actions = ?,
                expires_at = ?,
                version = ?,
                updated_at = ?,
                deleted_at = ?
          WHERE id = ?`,
        [
          dto.identityId,
          dto.title,
          dto.content,
          dto.type,
          dto.category,
          dto.importance,
          dto.importance,
          dto.status,
          dto.isRead ? 1 : 0,
          dto.readAt ? new Date(dto.readAt).toISOString() : null,
          null,
          null,
          dto.metadata ? JSON.stringify(dto.metadata) : null,
          dto.actions ? JSON.stringify(dto.actions) : null,
          dto.expiresAt ? new Date(dto.expiresAt).toISOString() : null,
          dto.version,
          new Date(dto.updatedAt).toISOString(),
          dto.deletedAt ? new Date(dto.deletedAt).toISOString() : null,
          dto.id,
        ],
      );
    } else {
      await this.db.execute(
        `INSERT INTO notifications (
            id,
            identity_id,
            title,
            content,
            type,
            category,
            importance,
            urgency,
            status,
            is_read,
            read_at,
            related_entity_type,
            related_entity_id,
            metadata,
            actions,
            expires_at,
            version,
            created_at,
            updated_at,
            deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dto.id,
          dto.identityId,
          dto.title,
          dto.content,
          dto.type,
          dto.category,
          dto.importance,
          dto.importance,
          dto.status,
          dto.isRead ? 1 : 0,
          dto.readAt ? new Date(dto.readAt).toISOString() : null,
          null,
          null,
          dto.metadata ? JSON.stringify(dto.metadata) : null,
          dto.actions ? JSON.stringify(dto.actions) : null,
          dto.expiresAt ? new Date(dto.expiresAt).toISOString() : null,
          dto.version,
          new Date(dto.createdAt).toISOString(),
          new Date(dto.updatedAt).toISOString(),
          dto.deletedAt ? new Date(dto.deletedAt).toISOString() : null,
        ],
      );
    }

    flushDomainEvents(notificationEventPublisher, notification);
  }

  async saveMany(notifications: Notification[]): Promise<void> {
    for (const notification of notifications) {
      await this.save(notification);
    }
  }

  async findByIdForIdentity(
    identityId: string,
    id: string,
    _options?: { includeChildren?: boolean },
  ): Promise<Notification | null> {
    const row = await this.db.getOptional<NotificationRow>(
      `SELECT * FROM notifications WHERE id = ? AND identity_id = ? LIMIT 1`,
      [id, identityId],
    );
    return row ? hydrateNotification(row) : null;
  }

  async findByIdentityId(
    identityId: string,
    options?: {
      includeChildren?: boolean;
      includeRead?: boolean;
      includeDeleted?: boolean;
      limit?: number;
      offset?: number;
    },
  ): Promise<Notification[]> {
    const filters = ['identity_id = ?'];
    const params: unknown[] = [identityId];

    if (!options?.includeDeleted) {
      filters.push('deleted_at IS NULL');
    }
    if (options?.includeRead === false) {
      filters.push('COALESCE(is_read, 0) = 0');
    }

    let sql = `SELECT * FROM notifications WHERE ${filters.join(' AND ')} ORDER BY created_at DESC`;
    if (typeof options?.limit === 'number') {
      sql += ' LIMIT ?';
      params.push(options.limit);
      if (typeof options?.offset === 'number') {
        sql += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    const rows = await this.db.getAll<NotificationRow>(sql, params);
    return rows.map((row) => hydrateNotification(row));
  }

  async findByStatus(
    identityId: string,
    status: NotificationStatus,
    options?: { limit?: number; offset?: number },
  ): Promise<Notification[]> {
    return this.findByIdentityId(identityId, {
      ...options,
      includeDeleted: false,
    }).then((items) => items.filter((item) => item.toServerDTO().status === status));
  }

  async findByCategory(
    identityId: string,
    category: NotificationCategory,
    options?: { limit?: number; offset?: number },
  ): Promise<Notification[]> {
    return this.findByIdentityId(identityId, {
      ...options,
      includeDeleted: false,
    }).then((items) => items.filter((item) => item.toServerDTO().category === category));
  }

  async findUnread(identityId: string, options?: { limit?: number }): Promise<Notification[]> {
    return this.findByIdentityId(identityId, {
      includeRead: false,
      includeDeleted: false,
      limit: options?.limit,
    });
  }

  async findByRelatedEntity(
    identityId: string,
    relatedEntityType: string,
    relatedEntityId: string,
  ): Promise<Notification[]> {
    const rows = await this.db.getAll<NotificationRow>(
      `SELECT * FROM notifications
        WHERE identity_id = ?
          AND related_entity_type = ?
          AND related_entity_id = ?
          AND deleted_at IS NULL
        ORDER BY created_at DESC`,
      [identityId, relatedEntityType, relatedEntityId],
    );
    return rows.map((row) => hydrateNotification(row));
  }

  async delete(identityId: string, id: string): Promise<void> {
    const existing = await this.findByIdForIdentity(identityId, id);
    if (!existing) {
      throw new Error('Notification not found for the current identity.');
    }
    await this.db.execute(
      `DELETE FROM notifications WHERE id = ? AND identity_id = ?`,
      [id, identityId],
    );
  }

  async deleteMany(identityId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(', ');
    await this.db.execute(
      `DELETE FROM notifications WHERE identity_id = ? AND id IN (${placeholders})`,
      [identityId, ...ids],
    );
  }

  async softDelete(identityId: string, id: string): Promise<void> {
    const existing = await this.findByIdForIdentity(identityId, id);
    if (!existing) {
      throw new Error('Notification not found for the current identity.');
    }
    await this.db.execute(
      `UPDATE notifications SET deleted_at = ? WHERE id = ? AND identity_id = ?`,
      [new Date().toISOString(), id, identityId],
    );
  }

  async exists(identityId: string, id: string): Promise<boolean> {
    return (await this.findByIdForIdentity(identityId, id)) !== null;
  }

  async countUnread(identityId: string): Promise<number> {
    const row = await this.db.getOptional<{ count: number }>(
      `SELECT COUNT(*) as count
         FROM notifications
        WHERE identity_id = ?
          AND deleted_at IS NULL
          AND COALESCE(is_read, 0) = 0`,
      [identityId],
    );
    return Number(row?.count ?? 0);
  }

  async countByCategory(_identityId: string): Promise<Record<NotificationCategory, number>> {
    const rows = await this.db.getAll<{ category: NotificationCategory; count: number }>(
      `SELECT category, COUNT(*) as count
         FROM notifications
        WHERE identity_id = ?
          AND deleted_at IS NULL
        GROUP BY category`,
      [_identityId],
    );

    const counts = {
      Task: 0,
      Goal: 0,
      Schedule: 0,
      Reminder: 0,
      Account: 0,
      System: 0,
      Other: 0,
    } as Record<NotificationCategory, number>;

    for (const row of rows) {
      counts[row.category] = Number(row.count ?? 0);
    }

    return counts;
  }

  async markManyAsRead(identityId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(', ');
    await this.db.execute(
      `UPDATE notifications
          SET is_read = 1,
              status = ?,
              read_at = ?,
              updated_at = ?
        WHERE identity_id = ?
          AND id IN (${placeholders})`,
      ['Read', new Date().toISOString(), new Date().toISOString(), identityId, ...ids],
    );
  }

  async markAllAsRead(identityId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.execute(
      `UPDATE notifications
          SET is_read = 1,
              status = ?,
              read_at = COALESCE(read_at, ?),
              updated_at = ?
        WHERE identity_id = ?
          AND deleted_at IS NULL
          AND COALESCE(is_read, 0) = 0`,
      ['Read', now, now, identityId],
    );
  }

  async cleanupExpired(beforeTimestamp: number): Promise<number> {
    const before = new Date(beforeTimestamp).toISOString();
    const result = await this.db.execute(
      `DELETE FROM notifications WHERE deleted_at IS NULL AND expires_at IS NOT NULL AND expires_at < ?`,
      [before],
    );
    return result.rowsAffected;
  }

  async cleanupDeleted(beforeTimestamp: number): Promise<number> {
    const before = new Date(beforeTimestamp).toISOString();
    const result = await this.db.execute(
      `DELETE FROM notifications WHERE deleted_at IS NOT NULL AND deleted_at < ?`,
      [before],
    );
    return result.rowsAffected;
  }
}
