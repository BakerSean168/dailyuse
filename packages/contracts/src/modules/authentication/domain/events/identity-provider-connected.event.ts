/**
 * Identity Provider Connected Event
 * 
 * Triggered when: User connects external identity provider (OAuth2)
 * Subscribers: Identity linking service
 * 
 * 【说明】
 * - aggregateId 已由 addDomainEvent 自动生成，无需重复定义
 * - occurredAt 已由 addDomainEvent 自动生成，无需重复定义
 */
export interface IdentityProviderConnectedEvent {
  /** External provider name (google, github, etc) */
  provider: string;
}
