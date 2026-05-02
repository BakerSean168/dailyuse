import type {
  ControlMode,
  ReminderStatus,
  GroupStatsServerDTO,
} from '@dailyuse/contracts/reminder';
import { ReminderGroup } from '../../../../domain-server/aggregates/reminder-group';
import { GroupStats } from '../../../../domain-server/value-objects';
import type { IdentityId } from '@dailyuse/domain-shared';

export type PowerSyncReminderGroupRow = {
  id: string;
  identity_id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  control_mode: string;
  enabled: number | boolean;
  status: string;
  order: number;
  stats: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export class PowerSyncReminderGroupMapper {
  static toDomain(data: PowerSyncReminderGroupRow): ReminderGroup {
    const stats = data.stats
      ? GroupStats.fromDTO(JSON.parse(data.stats) as GroupStatsServerDTO)
      : GroupStats.createEmpty();

    return ReminderGroup.load({
      id: data.id,
      identityId: data.identity_id as IdentityId,
      name: data.name,
      description: data.description ?? null,
      color: data.color ?? null,
      icon: data.icon ?? null,
      controlMode: data.control_mode as ControlMode,
      enabled: data.enabled === true || data.enabled === 1,
      status: data.status as ReminderStatus,
      order: Number(data.order ?? 0),
      stats,
      version: data.version ?? 1,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      deletedAt: data.deleted_at ? new Date(data.deleted_at).getTime() : null,
    });
  }

  static toPersistence(group: ReminderGroup) {
    const dto = group.toServerDTO();
    return {
      id: String(dto.id),
      identityId: String(dto.identityId),
      name: dto.name,
      description: dto.description ?? null,
      color: dto.color ?? null,
      icon: dto.icon ?? null,
      controlMode: dto.controlMode,
      enabled: dto.enabled ? 1 : 0,
      status: dto.status,
      order: dto.order,
      stats: JSON.stringify(dto.stats),
      version: dto.version,
      createdAt: new Date(dto.createdAt).toISOString(),
      updatedAt: new Date(dto.updatedAt).toISOString(),
      deletedAt: dto.deletedAt != null ? new Date(dto.deletedAt).toISOString() : null,
    };
  }
}
