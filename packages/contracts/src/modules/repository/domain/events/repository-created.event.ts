import type { IdentityId } from '../../../../primitives';

export interface RepositoryCreatedEvent {
  identityId: IdentityId;
  name: string;
  path: string;
}
