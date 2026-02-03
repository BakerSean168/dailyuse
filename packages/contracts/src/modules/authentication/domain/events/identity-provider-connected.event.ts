/**
 * Identity Provider Connected Event
 * 
 * Triggered when: User connects external identity provider (OAuth2)
 * Subscribers: Identity linking service
 */
export interface IdentityProviderConnectedEvent {
  /** User/Identity identifier */
  identityId: string;

  /** External provider name (google, github, etc) */
  provider: string;

  /** Connection timestamp */
  connectedAt: number;
}
