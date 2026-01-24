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
  createdAt: number;

  hasSpecificChange(key: string): boolean;

  toClientDTO(): TaskTemplateHistoryClientDTO;
  toServerDTO(): TaskTemplateHistoryServerDTO;
}

export interface TaskTemplateHistoryClientStatic {
  fromClientDTO(dto: TaskTemplateHistoryClientDTO): TaskTemplateHistoryClient;
  fromServerDTO(dto: TaskTemplateHistoryServerDTO): TaskTemplateHistoryClient;
}

export interface TaskTemplateHistoryClientInstance extends TaskTemplateHistoryClient {
  clone(): TaskTemplateHistoryClient;
}
