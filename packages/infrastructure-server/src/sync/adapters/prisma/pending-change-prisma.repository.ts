/**
 * PendingChange Prisma Repository
 *
 * Prisma implementation of IPendingChangeRepository.
 * Used for PostgreSQL (API server).
 */

import {
  PendingChange,
  type IPendingChangeRepository,
  type PendingChangeQueryOptions,
} from '@dailyuse/domain-server/sync';
import type { SyncableEntityType } from '@dailyuse/contracts/sync';

/**
 * 将 Prisma 模型转换为 PersistenceDTO 格式
 */
function toPersistenceDTO(record: any) {
  return {
    uuid: record.uuid,
    entityType: record.entityType,
    entityUuid: record.entityUuid,
    entityName: record.entityName,
    operation: record.operation,
    beforeDataJson: record.beforeDataJson,
    afterDataJson: record.afterDataJson,
    versionJson: record.versionJson,
    isSynced: record.isSynced,
    syncedInSession: record.syncedInSession,
    createdAt: Number(record.createdAt),
    syncedAt: record.syncedAt ? Number(record.syncedAt) : null,
  };
}

export class PendingChangePrismaRepository implements IPendingChangeRepository {
  constructor(
    private readonly prisma: any,
    private readonly accountUuid: string,
  ) {}

  async save(change: PendingChange): Promise<void> {
    const dto = change.toPersistenceDTO();
    await this.prisma.pendingChange.upsert({
      where: { uuid: dto.uuid },
      create: {
        uuid: dto.uuid,
        accountUuid: this.accountUuid,
        entityType: dto.entityType,
        entityUuid: dto.entityUuid,
        entityName: dto.entityName,
        operation: dto.operation,
        beforeDataJson: dto.beforeDataJson,
        afterDataJson: dto.afterDataJson,
        versionJson: dto.versionJson,
        isSynced: dto.isSynced,
        syncedInSession: dto.syncedInSession,
        createdAt: BigInt(dto.createdAt),
        syncedAt: dto.syncedAt ? BigInt(dto.syncedAt) : null,
      },
      update: {
        entityName: dto.entityName,
        operation: dto.operation,
        beforeDataJson: dto.beforeDataJson,
        afterDataJson: dto.afterDataJson,
        versionJson: dto.versionJson,
        isSynced: dto.isSynced,
        syncedInSession: dto.syncedInSession,
        syncedAt: dto.syncedAt ? BigInt(dto.syncedAt) : null,
      },
    });
  }

  async saveMany(changes: PendingChange[]): Promise<void> {
    await this.prisma.$transaction(
      changes.map((change) => {
        const dto = change.toPersistenceDTO();
        return this.prisma.pendingChange.upsert({
          where: { uuid: dto.uuid },
          create: {
            uuid: dto.uuid,
            accountUuid: this.accountUuid,
            entityType: dto.entityType,
            entityUuid: dto.entityUuid,
            entityName: dto.entityName,
            operation: dto.operation,
            beforeDataJson: dto.beforeDataJson,
            afterDataJson: dto.afterDataJson,
            versionJson: dto.versionJson,
            isSynced: dto.isSynced,
            syncedInSession: dto.syncedInSession,
            createdAt: BigInt(dto.createdAt),
            syncedAt: dto.syncedAt ? BigInt(dto.syncedAt) : null,
          },
          update: {
            entityName: dto.entityName,
            operation: dto.operation,
            beforeDataJson: dto.beforeDataJson,
            afterDataJson: dto.afterDataJson,
            versionJson: dto.versionJson,
            isSynced: dto.isSynced,
            syncedInSession: dto.syncedInSession,
            syncedAt: dto.syncedAt ? BigInt(dto.syncedAt) : null,
          },
        });
      }),
    );
  }

  async findByUuid(uuid: string): Promise<PendingChange | null> {
    const record = await this.prisma.pendingChange.findFirst({
      where: {
        uuid,
        accountUuid: this.accountUuid,
      },
    });
    if (!record) return null;
    return PendingChange.fromPersistenceDTO(toPersistenceDTO(record));
  }

  async findUnsyncedByEntityRef(
    entityType: SyncableEntityType,
    entityUuid: string,
  ): Promise<PendingChange[]> {
    const records = await this.prisma.pendingChange.findMany({
      where: {
        accountUuid: this.accountUuid,
        entityType,
        entityUuid,
        isSynced: false,
      },
      orderBy: { createdAt: 'asc' },
    });
    return records.map((r: unknown) => PendingChange.fromPersistenceDTO(toPersistenceDTO(r)));
  }

  async findAllUnsynced(limit?: number): Promise<PendingChange[]> {
    const records = await this.prisma.pendingChange.findMany({
      where: {
        accountUuid: this.accountUuid,
        isSynced: false,
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    return records.map((r: unknown) => PendingChange.fromPersistenceDTO(toPersistenceDTO(r)));
  }

  async findByQuery(options: PendingChangeQueryOptions): Promise<PendingChange[]> {
    const records = await this.prisma.pendingChange.findMany({
      where: {
        accountUuid: this.accountUuid,
        ...(options.entityType && { entityType: options.entityType }),
        ...(options.entityUuid && { entityUuid: options.entityUuid }),
        ...(options.operation && { operation: options.operation }),
        ...(options.isSynced !== undefined && { isSynced: options.isSynced }),
      },
      orderBy: { createdAt: 'asc' },
      skip: options.offset,
      take: options.limit,
    });
    return records.map((r: unknown) => PendingChange.fromPersistenceDTO(toPersistenceDTO(r)));
  }

  async count(options?: PendingChangeQueryOptions): Promise<number> {
    return this.prisma.pendingChange.count({
      where: {
        accountUuid: this.accountUuid,
        ...(options?.entityType && { entityType: options.entityType }),
        ...(options?.entityUuid && { entityUuid: options.entityUuid }),
        ...(options?.operation && { operation: options.operation }),
        ...(options?.isSynced !== undefined && { isSynced: options.isSynced }),
      },
    });
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.pendingChange.delete({
      where: { uuid },
    });
  }

  async deleteMany(uuids: string[]): Promise<void> {
    await this.prisma.pendingChange.deleteMany({
      where: {
        uuid: { in: uuids },
        accountUuid: this.accountUuid,
      },
    });
  }

  async deleteSynced(): Promise<number> {
    const result = await this.prisma.pendingChange.deleteMany({
      where: {
        accountUuid: this.accountUuid,
        isSynced: true,
      },
    });
    return result.count;
  }
}
