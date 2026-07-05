import type { IReminderTemplateRepository } from '../../../domain-server/repositories/i-reminder-template-repository';
import type { ReminderStatus, ReminderEventMap } from '@dailyuse/contracts/reminder';
import { ReminderTemplate } from '../../../domain-server/aggregates/reminder-template';
import { createTypedEventPublisher, eventBus, flushDomainEvents } from '@dailyuse/utils/domain';
import { createLogger } from '@dailyuse/utils/logger';
import {
  PowerSyncReminderTemplateMapper,
  type PowerSyncReminderTemplateRow,
  type PowerSyncReminderHistoryRow,
} from './mappers/powersync-reminder-template.mapper';

type Queryable = {
  getAll<T>(sql: string, parameters?: unknown[]): Promise<T[]>;
  getOptional<T>(sql: string, parameters?: unknown[]): Promise<T | null>;
  get<T>(sql: string, parameters?: unknown[]): Promise<T>;
  execute(sql: string, parameters?: unknown[]): Promise<unknown>;
};

const logger = createLogger('ReminderTemplatePowerSyncRepo');
const reminderEventPublisher = createTypedEventPublisher<ReminderEventMap>(eventBus);

export class ReminderTemplatePowerSyncRepository implements IReminderTemplateRepository {
  constructor(private readonly db: Queryable) {}

  async save(template: ReminderTemplate): Promise<void> {
    const data = PowerSyncReminderTemplateMapper.toPersistence(template);
    const pendingDomainEvents = template.domainEvents.map((event) => event.eventType);

    logger.info('[Reminder][Repo] Saving template', {
      templateId: String(template.id),
      identityId: String(template.identityId),
      title: template.title,
      status: template.status,
      selfEnabled: template.selfEnabled,
      effectiveEnabled: template.isEffectivelyEnabled(),
      nextTriggerAt: template.nextTriggerAt,
      historyCount: template.getAllHistory().length,
      pendingDomainEvents,
    });

    const existingTemplate = await this.db.getOptional<{ id: string }>(
      'SELECT id FROM reminder_templates WHERE id = ? LIMIT 1',
      [data.id],
    );

    if (existingTemplate) {
      await this.db.execute(
        `UPDATE reminder_templates
         SET name = ?,
             description = ?,
             type = ?,
             self_enabled = ?,
             status = ?,
             reminder_group_id = ?,
             importance_level = ?,
             tags = ?,
             color = ?,
             icon = ?,
             next_trigger_at = ?,
             version = ?,
             updated_at = ?,
             deleted_at = ?,
             trigger = ?,
             active_time = ?,
             active_hours = ?,
             notification_config = ?,
             stats = ?,
             click_rate = ?,
             ignore_rate = ?,
             avg_response_time = ?,
             snooze_count = ?,
             effectiveness_score = ?,
             sample_size = ?,
             last_analysis_time = ?,
             original_interval = ?,
             adjusted_interval = ?,
             adjustment_reason = ?,
             adjustment_time = ?,
             is_auto_adjusted = ?,
             user_confirmed = ?,
             smart_frequency_enabled = ?
         WHERE id = ?`,
        [
          data.name,
          data.description,
          data.type,
          data.selfEnabled,
          data.status,
          data.reminderGroupId,
          data.importanceLevel,
          data.tags,
          data.color,
          data.icon,
          data.nextTriggerAt,
          data.version,
          data.updatedAt,
          data.deletedAt,
          data.trigger,
          data.activeTime,
          data.activeHours,
          data.notificationConfig,
          data.stats,
          data.clickRate,
          data.ignoreRate,
          data.avgResponseTime,
          data.snoozeCount,
          data.effectivenessScore,
          data.sampleSize,
          data.lastAnalysisTime,
          data.originalInterval,
          data.adjustedInterval,
          data.adjustmentReason,
          data.adjustmentTime,
          data.isAutoAdjusted,
          data.userConfirmed,
          data.smartFrequencyEnabled,
          data.id,
        ],
      );
    } else {
      await this.db.execute(
        `INSERT INTO reminder_templates (
          id, identity_id, name, description, type, self_enabled, status, reminder_group_id,
          importance_level, tags, color, icon, next_trigger_at, version, created_at, updated_at,
          deleted_at, trigger, active_time, active_hours, notification_config, stats,
          click_rate, ignore_rate, avg_response_time, snooze_count, effectiveness_score, sample_size,
          last_analysis_time, original_interval, adjusted_interval, adjustment_reason, adjustment_time,
          is_auto_adjusted, user_confirmed, smart_frequency_enabled
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id,
          data.identityId,
          data.name,
          data.description,
          data.type,
          data.selfEnabled,
          data.status,
          data.reminderGroupId,
          data.importanceLevel,
          data.tags,
          data.color,
          data.icon,
          data.nextTriggerAt,
          data.version,
          data.createdAt,
          data.updatedAt,
          data.deletedAt,
          data.trigger,
          data.activeTime,
          data.activeHours,
          data.notificationConfig,
          data.stats,
          data.clickRate,
          data.ignoreRate,
          data.avgResponseTime,
          data.snoozeCount,
          data.effectivenessScore,
          data.sampleSize,
          data.lastAnalysisTime,
          data.originalInterval,
          data.adjustedInterval,
          data.adjustmentReason,
          data.adjustmentTime,
          data.isAutoAdjusted,
          data.userConfirmed,
          data.smartFrequencyEnabled,
        ],
      );
    }

    for (const history of template.getAllHistory()) {
      const dto = history.toServerDTO();
      const existingHistory = await this.db.getOptional<{ id: string }>(
        'SELECT id FROM reminder_history WHERE id = ? LIMIT 1',
        [dto.id],
      );

      if (existingHistory) {
        await this.db.execute(
          `UPDATE reminder_history
           SET result = ?,
               error = ?,
               notification_sent = ?,
               notification_channel = ?
           WHERE id = ?`,
          [
            dto.result,
            dto.error ?? null,
            dto.notificationSent ? 1 : 0,
            dto.notificationChannels ? JSON.stringify(dto.notificationChannels) : null,
            dto.id,
          ],
        );
      } else {
        await this.db.execute(
          `INSERT INTO reminder_history (
            id, identity_id, template_id, triggered_at, result, error, notification_sent, notification_channel, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            dto.id,
            dto.identityId,
            dto.templateId,
            new Date(dto.triggeredAt).toISOString(),
            dto.result,
            dto.error ?? null,
            dto.notificationSent ? 1 : 0,
            dto.notificationChannels ? JSON.stringify(dto.notificationChannels) : null,
            new Date(dto.createdAt).toISOString(),
          ],
        );
      }
    }

    if (pendingDomainEvents.length > 0) {
      flushDomainEvents(reminderEventPublisher, template);
      logger.info('[Reminder][Repo] Published domain events after PowerSync save', {
        templateId: String(template.id),
        publishedDomainEvents: pendingDomainEvents,
      });
    } else {
      logger.warn(
        '[Reminder][Repo] PowerSync save completed without domain events to publish',
        {
          templateId: String(template.id),
        },
      );
    }
  }

  async findById(
    id: string,
    options?: { includeHistory?: boolean },
  ): Promise<ReminderTemplate | null> {
    const row = await this.db.getOptional<PowerSyncReminderTemplateRow>(
      'SELECT * FROM reminder_templates WHERE id = ? LIMIT 1',
      [id],
    );
    if (!row) return null;
    const history = options?.includeHistory ? await this.loadHistory(row.id) : [];
    return PowerSyncReminderTemplateMapper.toDomain(row, history);
  }

  async findByIdentityId(
    identityId: string,
    options?: { includeHistory?: boolean; includeDeleted?: boolean },
  ): Promise<ReminderTemplate[]> {
    const sql = `SELECT * FROM reminder_templates WHERE identity_id = ?${
      options?.includeDeleted ? '' : ' AND deleted_at IS NULL'
    } ORDER BY created_at ASC`;
    return this.mapRows(await this.db.getAll(sql, [identityId]), options?.includeHistory);
  }

  async findByGroupId(
    groupId: string | null,
    options?: { includeHistory?: boolean; includeDeleted?: boolean },
  ): Promise<ReminderTemplate[]> {
    const sql = `SELECT * FROM reminder_templates WHERE ${
      groupId === null ? 'reminder_group_id IS NULL' : 'reminder_group_id = ?'
    }${options?.includeDeleted ? '' : ' AND deleted_at IS NULL'} ORDER BY created_at ASC`;
    return this.mapRows(
      await this.db.getAll(sql, groupId === null ? [] : [groupId]),
      options?.includeHistory,
    );
  }

  async findActive(identityId?: string): Promise<ReminderTemplate[]> {
    const sql = `SELECT * FROM reminder_templates WHERE self_enabled = 1 AND status = 'Active' AND deleted_at IS NULL${
      identityId ? ' AND identity_id = ?' : ''
    } ORDER BY created_at ASC`;
    return this.mapRows(await this.db.getAll(sql, identityId ? [identityId] : []), false);
  }

  async findByNextTriggerBefore(
    beforeTime: number,
    identityId?: string,
  ): Promise<ReminderTemplate[]> {
    const sql = `SELECT * FROM reminder_templates WHERE self_enabled = 1 AND status = 'Active' AND deleted_at IS NULL AND next_trigger_at <= ?${
      identityId ? ' AND identity_id = ?' : ''
    } ORDER BY next_trigger_at ASC`;
    const params = identityId
      ? [new Date(beforeTime).toISOString(), identityId]
      : [new Date(beforeTime).toISOString()];
    return this.mapRows(await this.db.getAll(sql, params), false);
  }

  async findByIds(
    ids: string[],
    options?: { includeHistory?: boolean },
  ): Promise<ReminderTemplate[]> {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(', ');
    const rows = await this.db.getAll<PowerSyncReminderTemplateRow>(
      `SELECT * FROM reminder_templates WHERE id IN (${placeholders})`,
      ids,
    );
    const templates = await this.mapRows(rows, options?.includeHistory);
    const map = new Map(templates.map((template) => [String(template.id), template]));
    return ids.map((id) => map.get(id)).filter((item): item is ReminderTemplate => !!item);
  }

  async delete(id: string): Promise<void> {
    await this.db.execute('DELETE FROM reminder_templates WHERE id = ?', [id]);
  }

  async exists(id: string): Promise<boolean> {
    const row = await this.db.getOptional<{ id: string }>(
      'SELECT id FROM reminder_templates WHERE id = ? LIMIT 1',
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
      `SELECT COUNT(*) as count FROM reminder_templates WHERE ${clauses.join(' AND ')}`,
      params,
    );
    return Number(result.count ?? 0);
  }

  private async mapRows(
    rows: PowerSyncReminderTemplateRow[],
    includeHistory?: boolean,
  ): Promise<ReminderTemplate[]> {
    return Promise.all(
      rows.map(async (row) =>
        PowerSyncReminderTemplateMapper.toDomain(
          row,
          includeHistory ? await this.loadHistory(row.id) : [],
        ),
      ),
    );
  }

  private async loadHistory(templateId: string): Promise<PowerSyncReminderHistoryRow[]> {
    return this.db.getAll<PowerSyncReminderHistoryRow>(
      'SELECT * FROM reminder_history WHERE template_id = ? ORDER BY triggered_at DESC',
      [templateId],
    );
  }
}
