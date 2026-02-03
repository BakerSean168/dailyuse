import type { IdentityId } from '@/primitives';

export interface SessionCreatedEvent {
  /** User/Identity identifier */
  identityId: IdentityId;
}