export interface UserSettingResetEvent {
  readonly aggregateId: string;
  readonly timestamp: number;
  readonly identityId: string;
  readonly category?: string;
}
