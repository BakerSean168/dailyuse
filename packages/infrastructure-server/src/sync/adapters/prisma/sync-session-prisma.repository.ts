/**
 * SyncSession Prisma Repository
 *
 * Prisma implementation of ISyncSessionRepository.
 * Used for PostgreSQL (API server).
 */

import {
  SyncSession,
  type ISyncSessionRepository,
  type SyncSessionQueryOptions,
} from '@dailyuse/domain-server/sync';
import { SyncSessionStatus } from '@dailyuse/contracts/sync';

/**
 * �?Prisma 模型转换�?PersistenceDTO 格式
 */
function toPersistenceDTO(record: any) {
  return {
    uuid: record.uuid,
    profileId: record.profileId,
    status: record.status,
    direction: record.direction,
    strategy: record.strategy,
    triggerType: record.triggerType,
    triggerDeviceJson: record.triggerDeviceJson,
    startVersionJson: record.startVersionJson,
    endVersionJson: record.endVersionJson,
    localSnapshotId: record.localSnapshotId,
    remoteSnapshotId: record.remoteSnapshotId,
    statisticsJson: record.statisticsJson,
    errorJson: record.errorJson,
    canRetry: record.canRetry,
    retryCount: record.retryCount,
    createdAt: Number(record.createdAt),
    startedAt: record.startedAt ? Number(record.startedAt) : null,
    completedAt: record.completedAt ? Number(record.completedAt) : null,
    updatedAt: Number(record.updatedAt),
  };
}

export class SyncSessionPrismaRepository implements ISyncSessionRepository {
  constructor(
    private readonly prisma: any,
    private readonly accountUuid: string,
  ) {}

  async save(session: SyncSession): Promise<void> {
    const dto = session.toPersistenceDTO();
    await this.prisma.syncSession.upsert({
      where: { uuid: dto.uuid },
      create: {
        uuid: dto.uuid,
        accountUuid: this.accountUuid,
        profileId: dto.profileId,
        status: dto.status,
        direction: dto.direction,
        strategy: dto.strategy,
        triggerType: dto.triggerType,
        triggerDeviceJson: dto.triggerDeviceJson,
        startVersionJson: dto.startVersionJson,
        endVersionJson: dto.endVersionJson,
        localSnapshotId: dto.localSnapshotId,
        remoteSnapshotId: dto.remoteSnapshotId,
        statisticsJson: dto.statisticsJson,
        errorJson: dto.errorJson,
        canRetry: dto.canRetry,
        retryCount: dto.retryCount,
        createdAt: BigInt(dto.createdAt),
        startedAt: dto.startedAt ? BigInt(dto.startedAt) : null,
        completedAt: dto.completedAt ? BigInt(dto.completedAt) : null,
        updatedAt: BigInt(dto.updatedAt),
      },
      update: {
        status: dto.status,
        direction: dto.direction,
        strategy: dto.strategy,
        triggerType: dto.triggerType,
        triggerDeviceJson: dto.triggerDeviceJson,
        startVersionJson: dto.startVersionJson,
        endVersionJson: dto.endVersionJson,
        localSnapshotId: dto.localSnapshotId,
        remoteSnapshotId: dto.remoteSnapshotId,
        statisticsJson: dto.statisticsJson,
        errorJson: dto.errorJson,
        canRetry: dto.canRetry,
        retryCount: dto.retryCount,
        startedAt: dto.startedAt ? BigInt(dto.startedAt) : null,
        completedAt: dto.completedAt ? BigInt(dto.completedAt) : null,
        updatedAt: BigInt(dto.updatedAt),
      },
    });
  }

  async findByUuid(uuid: string): Promise<SyncSession | null> {
    const record = await this.prisma.syncSession.findFirst({
      where: {
        uuid,
        accountUuid: this.accountUuid,
      },
    });
    if (!record) return null;
    return SyncSession.fromPersistenceDTO(toPersistenceDTO(record));
  }

  async findLatestByProfileId(profileId: string): Promise<SyncSession | null> {
    const record = await this.prisma.syncSession.findFirst({
      where: {
        profileId,
        accountUuid: this.accountUuid,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) return null;
    return SyncSession.fromPersistenceDTO(toPersistenceDTO(record));
  }

  async findInProgress(): Promise<SyncSession[]> {
    const inProgressStatuses = [
      SyncSessionStatus.PENDING,
      SyncSessionStatus.COLLECTING,
      SyncSessionStatus.SYNCING,
      SyncSessionStatus.CONFLICTED,
    ];

    const records = await this.prisma.syncSession.findMany({
      where: {
        accountUuid: this.accountUuid,
        status: { in: inProgressStatuses },
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r: unknown) => SyncSession.fromPersistenceDTO(toPersistenceDTO(r)));
  }

  async findByQuery(options: SyncSessionQueryOptions): Promise<SyncSession[]> {
    const records = await this.prisma.syncSession.findMany({
      where: {
        accountUuid: this.accountUuid,
        ...(options.profileId && { profileId: options.profileId }),
        ...(options.status && options.status.length > 0 && { status: { in: options.status } }),
      },
      orderBy: { createdAt: 'desc' },
      skip: options.offset,
      take: options.limit,
    });
    return records.map((r: unknown) => SyncSession.fromPersistenceDTO(toPersistenceDTO(r)));
  }

  async count(options?: SyncSessionQueryOptions): Promise<number> {
    return this.prisma.syncSession.count({
      where: {
        accountUuid: this.accountUuid,
        ...(options?.profileId && { profileId: options.profileId }),
        ...(options?.status && options.status.length > 0 && { status: { in: options.status } }),
      },
    });
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.syncSession.delete({
      where: { uuid },
    });
  }
}
