import type { IdentityId } from '@/primitives';

/**
 * Session Revoked Event
 * 
 * Triggered when: User session is revoked
 * Subscribers: Session cleanup service
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface SessionRevokedEvent {}