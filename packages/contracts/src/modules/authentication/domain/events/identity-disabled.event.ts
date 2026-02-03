import type { IdentityId } from '@/primitives';

export interface IdentityDisabledEvent {
  /** User/Identity identifier */
  identityId: IdentityId;
}