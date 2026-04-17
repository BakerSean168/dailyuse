export interface EditorResourceSavedDomainEvent {
  aggregateId: string;
  timestamp: number;
  resourceId: string;
}
