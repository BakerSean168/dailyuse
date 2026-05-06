import type { IdentityId, SettingId } from '../../../../primitives';

export interface SettingImportedEvent {
  readonly aggregateId: SettingId;
  readonly timestamp: number;
  readonly identityId: IdentityId;
  readonly imported: number;
  readonly skipped: number;
}
