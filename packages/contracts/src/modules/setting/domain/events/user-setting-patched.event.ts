/**
 * User Setting Patched Event
 *
 * Triggered when: A category of user settings is updated via patchCategory()
 */
export interface UserSettingPatchedEvent {
  readonly identityId: string;
  readonly category: string;
  readonly changes: Record<string, unknown>;
  readonly newVersion: number;
  readonly timestamp: number;
}
