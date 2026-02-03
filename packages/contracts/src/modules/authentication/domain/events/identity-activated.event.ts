import type { IdentityId } from '@/primitives';

export interface IdentityActivatedEvent {
  /** User/Identity identifier */
  identityId: IdentityId;
}