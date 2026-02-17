export interface EditorWorkspaceUpdatedDomainEvent {
  aggregateId: string;
  timestamp: number;
  changedFields: string[];
}

export interface EditorDocumentSavedDomainEvent {
  aggregateId: string;
  timestamp: number;
  documentId: string;
}
