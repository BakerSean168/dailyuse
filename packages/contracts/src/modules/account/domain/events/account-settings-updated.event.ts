/**
 * Account Settings Updated Event
 * 
 * Triggered when: User account settings are changed
 * Subscribers: Settings service, Configuration cache
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface AccountSettingsUpdatedEvent {
  /** List of setting keys that were changed */
  settingKeys: string[];
}
