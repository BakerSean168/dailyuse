/**
 * Domain Event: User Data Import Dry Run Validated
 */

export interface UserDataImportDryRunValidatedEvent {
  identityId: string;
  batchId: string;
  created: Record<string, number>;
  updatedSingletons: Record<string, number>;
  skipped: Record<string, number>;
  warnings: string[];
}
