export interface SettingImportedEvent {
  readonly aggregateId: string;
  readonly timestamp: number;
  readonly identityId: string;
  readonly imported: number;
  readonly skipped: number;
}
