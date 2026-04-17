export interface EditorWorkspaceUpdatedDomainEvent {
  aggregateId: string;
  timestamp: number;
  changedFields: string[];
}
