import type { IdentityId } from '../../../../primitives';
import type { ReminderGroupServerDTO } from '../../aggregates/reminder-group-server';

/**
 * Reminder Group Created Event
 *
 * Triggered when: Reminder group is created
 * Subscribers: Reminder categorization service
 *
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface ReminderGroupCreatedEvent {
  identityId: IdentityId;
  group: ReminderGroupServerDTO;
}
