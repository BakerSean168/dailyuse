import type { IdentityId } from '../../../../primitives';

/**
 * Identity Activated Event
 * 
 * Triggered when: Identity is activated
 * Subscribers: Identity service
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface IdentityActivatedEvent {}
