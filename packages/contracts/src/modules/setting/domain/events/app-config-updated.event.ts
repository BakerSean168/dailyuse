export interface AppConfigUpdatedEvent {
  readonly aggregateId: string;
  readonly timestamp: number;
  readonly identityId: string;
  readonly fields: string[];
}
