/**
 * Domain Event: User Data Imported
 */

export interface UserDataImportedEvent {
  identityId: string;
  batchId: string;
  created: Record<string, number>;
  updatedSingletons: Record<string, number>;
  skipped: Record<string, number>;
  warnings: string[];
}
