import type { IdentityId } from '@/primitives';

/**
 * Identity Disabled Event
 * 
 * Triggered when: Identity is disabled
 * Subscribers: Identity service
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface IdentityDisabledEvent {}