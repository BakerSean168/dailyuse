export interface UserSettingUpdatedEvent {
  readonly aggregateId: string;
  readonly timestamp: number;
  readonly identityId: string;
  readonly changedKeys: string[];
}
