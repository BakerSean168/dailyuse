/**
 * TaskTemplateHistory Entity - Client Interface
 */

import type { TaskTemplateHistoryServerDTO } from './TaskTemplateHistoryServer';

export interface TaskTemplateHistoryClientDTO {
  uuid: string;
  templateUuid: string;
  action: string;
  changes?: any | null;
  createdAt: number;
}

export interface TaskTemplateHistoryClient {
  uuid: string;
  templateUuid: string;
  action: string;
  changes?: any | null;
  createdAt: Date;

  hasSpecificChange(key: string): boolean;}

export interface TaskTemplateHistoryClientInstance extends TaskTemplateHistoryClient {
  clone(): TaskTemplateHistoryClient;
}
