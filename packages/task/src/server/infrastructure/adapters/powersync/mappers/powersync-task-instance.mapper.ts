import { TaskInstance } from '../../../../domain/aggregates/task-instance';
import { TaskInstanceId } from '../../../../domain/value-objects/task-instance-id';
import { TaskTemplateId } from '../../../../domain/value-objects/task-template-id';
import { IdentityId } from '@memoflow/domain-shared';
import { TaskTimeConfig } from '../../../../domain/value-objects/task-time-config';
import type { ImportanceLevel } from '@memoflow/contracts/shared';
import type { TaskInstanceStatus } from '@memoflow/contracts/task';

export type PowerSyncTaskInstanceRow = {
  id: string;
  template_id: string;
  identity_id: string;
  instance_date: string;
  occurrence_key: string | null; // R2-1 幂等键
  status: string;
  importance: string | null;
  priority: number | null;
  time_config: string;
  actual_start_time: string | null;
  actual_end_time: string | null;
  comment: string | null;
  version: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export class PowerSyncTaskInstanceMapper {
  static toDomain(data: PowerSyncTaskInstanceRow): TaskInstance {
    return TaskInstance.load({
      id: TaskInstanceId.of(data.id),
      templateId: TaskTemplateId.of(data.template_id),
      identityId: IdentityId.of(data.identity_id),
      instanceDate: new Date(data.instance_date).getTime(),
      occurrenceKey: data.occurrence_key ?? null,
      timeConfig: TaskTimeConfig.fromDTO(JSON.parse(data.time_config || '{}')),
      importance: (data.importance ?? 'Moderate') as unknown as ImportanceLevel,
      priority: data.priority ?? undefined,
      status: data.status as TaskInstanceStatus,
      completionRecord: null,
      skipRecord: null,
      actualStartTime: data.actual_start_time ? new Date(data.actual_start_time).getTime() : null,
      actualEndTime: data.actual_end_time ? new Date(data.actual_end_time).getTime() : null,
      note: data.comment ?? null,
      version: data.version ?? 1,
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime(),
      deletedAt: data.deleted_at ? new Date(data.deleted_at).getTime() : null,
    });
  }

  static toPersistence(instance: TaskInstance) {
    const dto = instance.toServerDTO();
    return {
      id: String(dto.id),
      templateId: String(dto.templateId),
      identityId: String(dto.identityId),
      instanceDate: new Date(dto.instanceDate).toISOString(),
      occurrenceKey: instance.occurrenceKey,
      status: dto.status,
      importance: dto.importance,
      priority: dto.priority ?? null,
      timeConfig: JSON.stringify(dto.timeConfig),
      actualStartTime:
        dto.actualStartTime != null ? new Date(dto.actualStartTime).toISOString() : null,
      actualEndTime: dto.actualEndTime != null ? new Date(dto.actualEndTime).toISOString() : null,
      comment: dto.comment ?? null,
      version: dto.version,
      createdAt: new Date(dto.createdAt).toISOString(),
      updatedAt: new Date(dto.updatedAt).toISOString(),
      deletedAt: dto.deletedAt != null ? new Date(dto.deletedAt).toISOString() : null,
    };
  }
}
