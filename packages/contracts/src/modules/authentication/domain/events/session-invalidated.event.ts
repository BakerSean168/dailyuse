/**
 * Session Invalidated Event
 * 
 * Triggered when: User session is invalidated (logout, password change, etc)
 * Subscribers: Session cleanup service
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface SessionInvalidatedEvent {}
