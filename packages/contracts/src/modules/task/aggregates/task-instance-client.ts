/**
 * TaskInstance Aggregate Root - Client Interface
 */

import type {
  TaskInstanceId,
  TaskTemplateId,
  IdentityId,
  DomainDate,
  TransferDate,
} from '@/primitives';
import type { TaskInstanceServerDTO } from './task-instance-server';
import type { TaskInstanceStatus } from '../value-objects/task-instance-status';
import { ImportanceLevel } from '../../../shared/importance';
import type {
  TaskTimeConfig,
  TaskTimeConfigDTO,
  CompletionRecord,
  CompletionRecordDTO,
} from '../value-objects';

export interface TaskInstanceClientDTO {
  id: string;
  templateId: string;
  identityId: string;
  instanceDate: TransferDate;
  timeConfig: TaskTimeConfigDTO;
 
  importance?: ImportanceLevel;

  priority?: number;
  status: TaskInstanceStatus;
  completionRecord: CompletionRecordDTO | null;

  actualStartTime: TransferDate | null;
  actualEndTime: TransferDate | null;
  note: string | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  instanceDateFormatted: string;
  statusText: string;
  statusColor: string;
  isCompleted: boolean;
  isSkipped: boolean;
  isPending: boolean;
  isExpired: boolean;
  hasNote: boolean;
  actualDuration: number | null;
  durationText: string | null;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

export interface TaskInstanceClient {
  id: TaskInstanceId;
  templateId: TaskTemplateId;
  identityId: IdentityId;
  instanceDate: DomainDate;
  timeConfig: TaskTimeConfig;

  importance?: ImportanceLevel;

  priority?: number;
  status: TaskInstanceStatus;
  completionRecord: CompletionRecord | null;

  actualStartTime: DomainDate | null;
  actualEndTime: DomainDate | null;
  note: string | null;
  createdAt: DomainDate;
  updatedAt: DomainDate;
  instanceDateFormatted: string;
  statusText: string;
  statusColor: string;
  isCompleted: boolean;
  isSkipped: boolean;
  isPending: boolean;
  isExpired: boolean;
  hasNote: boolean;
  actualDuration: number | null;
  durationText: string | null;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;

}
