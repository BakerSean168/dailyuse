/**
 * TaskTemplateHistory Entity - Client Interface
 */

import type {
  TaskTemplateId,
  DomainDate,
  TransferDate,
} from '@/primitives';
import type { TaskTemplateHistoryServerDTO } from './task-template-history-server';

export interface TaskTemplateHistoryClientDTO {
  id: string;
  templateId: string;
  action: string;
  changes: any | null;
  createdAt: TransferDate;
}

export interface TaskTemplateHistoryClient {
  id: string;
  templateId: TaskTemplateId;
  action: string;
  changes: any | null;
  createdAt: DomainDate;

}
