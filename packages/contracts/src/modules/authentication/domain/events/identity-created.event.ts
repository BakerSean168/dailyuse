import type { IdentityId } from '@/primitives';

/**
 * Identity Created Event
 * 
 * Triggered when a new AuthIdentity is created
 * Used by other modules (e.g., Account) to create corresponding entities
 */
export interface IdentityCreatedEvent {
  /** Identity identifier */
  identityId: IdentityId;
  
  /** Creation method: EMAIL, OAUTH, PHONE */
  createMethod: 'EMAIL' | 'OAUTH' | 'PHONE';
  
  /** Email address (for EMAIL creation) */
  email?: string;
  
  /** OAuth provider (for OAUTH creation) */
  oauthProvider?: string;
  
  /** Phone number (for PHONE creation) */
  phoneNumber?: string;
}
