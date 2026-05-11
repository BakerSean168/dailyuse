import type { IdentityId } from '../../../../primitives';

export interface SettingImportedEvent {
  readonly identityId: IdentityId;
  readonly imported: number;
  readonly skipped: number;
}
