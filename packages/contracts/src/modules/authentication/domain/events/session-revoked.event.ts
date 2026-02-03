import type { IdentityId } from '@/primitives';

export interface SessionRevokedEvent {
  /** User/Identity identifier */
  identityId: IdentityId;
}