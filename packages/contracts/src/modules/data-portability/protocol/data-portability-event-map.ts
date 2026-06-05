/**
 * Data Portability Event Map — domain event key to payload type mapping
 */

import type { UserDataExportedEvent } from '../domain/events/user-data-exported.event';
import type { UserDataImportDryRunValidatedEvent } from '../domain/events/user-data-import-dry-run-validated.event';
import type { UserDataImportedEvent } from '../domain/events/user-data-imported.event';

export const DataPortabilityEventTopics = {
  EXPORTED: 'data-portability:exported',
  IMPORT_DRY_RUN_VALIDATED: 'data-portability:import-dry-run-validated',
  IMPORTED: 'data-portability:imported',
} as const;

export type DataPortabilityEventMap = {
  [DataPortabilityEventTopics.EXPORTED]: UserDataExportedEvent;
  [DataPortabilityEventTopics.IMPORT_DRY_RUN_VALIDATED]: UserDataImportDryRunValidatedEvent;
  [DataPortabilityEventTopics.IMPORTED]: UserDataImportedEvent;
};
