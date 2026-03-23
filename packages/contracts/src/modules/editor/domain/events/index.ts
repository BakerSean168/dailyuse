export interface EditorWorkspaceUpdatedDomainEvent {
  aggregateId: string;
  timestamp: number;
  changedFields: string[];
}

export interface EditorResourceSavedDomainEvent {
  aggregateId: string;
  timestamp: number;
  resourceId: string;
}
