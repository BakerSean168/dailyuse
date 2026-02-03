/**
 * Account Closed Event
 * 
 * Triggered when: Account is closed/deleted
 * Subscribers: Data cleanup, Account statistics
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 * - 事件内只需包含额外的业务数据，此事件无额外数据
 */
export interface AccountClosedEvent {}
