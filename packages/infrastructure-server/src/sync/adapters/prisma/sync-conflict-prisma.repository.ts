/**
 * SyncConflict Prisma Repository
 *
 * Prisma implementation of ISyncConflictRepository.
 * Used for PostgreSQL (API server).
 */

import {
  SyncConflict,
  type ISyncConflictRepository,
  type SyncConflictQueryOptions,
} from '@dailyuse/domain-server/sync';
import { ConflictStatus } from '@dailyuse/contracts/sync';

/**
 * �?Prisma 模型转换�?PersistenceDTO 格式
 */
function toPersistenceDTO(record: any) {
  return {
    uuid: record.uuid,
    sessionId: record.sessionId,
    entityType: record.entityType,
    entityUuid: record.entityUuid,
    entityName: record.entityName,
    conflictType: record.conflictType,
    localVersionJson: record.localVersionJson,
    localDataJson: record.localDataJson,
    remoteVersionJson: record.remoteVersionJson,
    remoteDataJson: record.remoteDataJson,
    status: record.status,
    autoResolvable: record.autoResolvable,
    resolutionJson: record.resolutionJson,
    createdAt: Number(record.createdAt),
    updatedAt: Number(record.updatedAt),
  };
}

export class SyncConflictPrismaRepository implements ISyncConflictRepository {
  constructor(
    private readonly prisma: any,
    private readonly accountUuid: string,
  ) {}

  async save(conflict: SyncConflict): Promise<void> {
    const dto = conflict.toPersistenceDTO();
    await this.prisma.syncConflict.upsert({
      where: { uuid: dto.uuid },
      create: {
        uuid: dto.uuid,
        accountUuid: this.accountUuid,
        sessionId: dto.sessionId,
        entityType: dto.entityType,
        entityUuid: dto.entityUuid,
        entityName: dto.entityName,
        conflictType: dto.conflictType,
        localVersionJson: dto.localVersionJson,
        localDataJson: dto.localDataJson,
        remoteVersionJson: dto.remoteVersionJson,
        remoteDataJson: dto.remoteDataJson,
        status: dto.status,
        autoResolvable: dto.autoResolvable,
        resolutionJson: dto.resolutionJson,
        createdAt: BigInt(dto.createdAt),
        updatedAt: BigInt(dto.updatedAt),
      },
      update: {
        status: dto.status,
        autoResolvable: dto.autoResolvable,
        resolutionJson: dto.resolutionJson,
        updatedAt: BigInt(dto.updatedAt),
      },
    });
  }

  async saveMany(conflicts: SyncConflict[]): Promise<void> {
    await this.prisma.$transaction(
      conflicts.map((conflict) => {
        const dto = conflict.toPersistenceDTO();
        return this.prisma.syncConflict.upsert({
          where: { uuid: dto.uuid },
          create: {
            uuid: dto.uuid,
            accountUuid: this.accountUuid,
            sessionId: dto.sessionId,
            entityType: dto.entityType,
            entityUuid: dto.entityUuid,
            entityName: dto.entityName,
            conflictType: dto.conflictType,
            localVersionJson: dto.localVersionJson,
            localDataJson: dto.localDataJson,
            remoteVersionJson: dto.remoteVersionJson,
            remoteDataJson: dto.remoteDataJson,
            status: dto.status,
            autoResolvable: dto.autoResolvable,
            resolutionJson: dto.resolutionJson,
            createdAt: BigInt(dto.createdAt),
            updatedAt: BigInt(dto.updatedAt),
          },
          update: {
            status: dto.status,
            autoResolvable: dto.autoResolvable,
            resolutionJson: dto.resolutionJson,
            updatedAt: BigInt(dto.updatedAt),
          },
        });
      }),
    );
  }

  async findByUuid(uuid: string): Promise<SyncConflict | null> {
    const record = await this.prisma.syncConflict.findFirst({
      where: {
        uuid,
        accountUuid: this.accountUuid,
      },
    });
    if (!record) return null;
    return SyncConflict.fromPersistenceDTO(toPersistenceDTO(record));
  }

  async findBySessionId(sessionId: string): Promise<SyncConflict[]> {
    const records = await this.prisma.syncConflict.findMany({
      where: {
        sessionId,
        accountUuid: this.accountUuid,
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r: unknown) => SyncConflict.fromPersistenceDTO(toPersistenceDTO(r)));
  }

  async findUnresolved(sessionId?: string): Promise<SyncConflict[]> {
    const records = await this.prisma.syncConflict.findMany({
      where: {
        accountUuid: this.accountUuid,
        status: ConflictStatus.UNRESOLVED,
        ...(sessionId && { sessionId }),
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r: unknown) => SyncConflict.fromPersistenceDTO(toPersistenceDTO(r)));
  }

  async findAutoResolvable(sessionId: string): Promise<SyncConflict[]> {
    const records = await this.prisma.syncConflict.findMany({
      where: {
        sessionId,
        accountUuid: this.accountUuid,
        status: ConflictStatus.UNRESOLVED,
        autoResolvable: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r: unknown) => SyncConflict.fromPersistenceDTO(toPersistenceDTO(r)));
  }

  async findByQuery(options: SyncConflictQueryOptions): Promise<SyncConflict[]> {
    const records = await this.prisma.syncConflict.findMany({
      where: {
        accountUuid: this.accountUuid,
        ...(options.sessionId && { sessionId: options.sessionId }),
        ...(options.entityType && { entityType: options.entityType }),
        ...(options.status && { status: options.status }),
        ...(options.conflictType && { conflictType: options.conflictType }),
        ...(options.autoResolvable !== undefined && { autoResolvable: options.autoResolvable }),
      },
      orderBy: { createdAt: 'desc' },
      skip: options.offset,
      take: options.limit,
    });
    return records.map((r: unknown) => SyncConflict.fromPersistenceDTO(toPersistenceDTO(r)));
  }

  async count(options?: SyncConflictQueryOptions): Promise<number> {
    return this.prisma.syncConflict.count({
      where: {
        accountUuid: this.accountUuid,
        ...(options?.sessionId && { sessionId: options.sessionId }),
        ...(options?.entityType && { entityType: options.entityType }),
        ...(options?.status && { status: options.status }),
        ...(options?.conflictType && { conflictType: options.conflictType }),
        ...(options?.autoResolvable !== undefined && { autoResolvable: options.autoResolvable }),
      },
    });
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.syncConflict.delete({
      where: { uuid },
    });
  }

  async deleteBySessionId(sessionId: string): Promise<number> {
    const result = await this.prisma.syncConflict.deleteMany({
      where: {
        sessionId,
        accountUuid: this.accountUuid,
      },
    });
    return result.count;
  }
}
