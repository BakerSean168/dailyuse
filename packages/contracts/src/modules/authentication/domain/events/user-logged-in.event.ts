/**
 * User Logged In Event
 * 
 * Triggered when: User successfully logs in
 * Subscribers: Session tracking, Audit log, User activity
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface UserLoggedInEvent {
  /** Login method (password, oauth2, etc) */
  method: string;
}
