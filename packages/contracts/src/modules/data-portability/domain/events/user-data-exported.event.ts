/**
 * Domain Event: User Data Exported
 */

import type { ExportableModule } from '../../dtos/exportable-module.dto';

export interface UserDataExportedEvent {
  identityId: string;
  requestedModules: ExportableModule[];
  fileName: string;
  entityCounts: Record<string, number>;
  warnings: string[];
}
