import type { IdentityId } from '../../../../primitives';

/**
 * User Setting Patched Event
 *
 * Triggered when: A category of user settings is updated via patchCategory()
 */
export interface UserSettingPatchedEvent {
  readonly identityId: IdentityId;
  readonly category: string;
  readonly changes: Record<string, unknown>;
  readonly newVersion: number;
}
