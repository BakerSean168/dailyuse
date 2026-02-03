/**
 * User Registered Event
 * 
 * Triggered when: New user successfully registers
 * Subscribers: Onboarding service, User creation, Email service
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface UserRegisteredEvent {
  /** User email */
  email: string;
}
