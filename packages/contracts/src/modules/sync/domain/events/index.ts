export interface SyncCompletedEvent {
  aggregateId: string;
  timestamp: number;
  pulledCount: number;
  pushedCount: number;
}

export interface SyncFailedEvent {
  aggregateId: string;
  timestamp: number;
  errorCode: string;
  errorMessage: string;
}
