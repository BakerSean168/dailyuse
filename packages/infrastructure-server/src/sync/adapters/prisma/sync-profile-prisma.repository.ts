/**
 * SyncProfile Prisma Repository
 *
 * Prisma implementation of ISyncProfileRepository.
 * Used for PostgreSQL (API server).
 */

import {
  SyncProfile,
  type ISyncProfileRepository,
  type SyncProfileQueryOptions,
} from '@dailyuse/domain-server/sync';

/**
 * 灏?Prisma 妯″瀷杞崲涓?PersistenceDTO 鏍煎紡
 */
function toPersistenceDTO(record: any) {
  return {
    uuid: record.uuid,
    name: record.name,
    description: record.description,
    providerType: record.providerType,
    providerConfigJson: record.providerConfigJson,
    syncConfigJson: record.syncConfigJson,
    isDefault: record.isDefault,
    isActive: record.isActive,
    isConnected: record.isConnected,
    lastSyncAt: record.lastSyncAt ? Number(record.lastSyncAt) : null,
    lastSyncVersionJson: record.lastSyncVersionJson,
    lastSyncResult: record.lastSyncResult,
    historyStatsJson: record.historyStatsJson,
    createdAt: Number(record.createdAt),
    updatedAt: Number(record.updatedAt),
  };
}

export class SyncProfilePrismaRepository implements ISyncProfileRepository {
  constructor(
    private readonly prisma: any,
    private readonly accountUuid: string,
  ) {}

  async save(profile: SyncProfile): Promise<void> {
    const dto = profile.toPersistenceDTO();
    await this.prisma.syncProfile.upsert({
      where: { uuid: dto.uuid },
      create: {
        uuid: dto.uuid,
        accountUuid: this.accountUuid,
        name: dto.name,
        description: dto.description,
        providerType: dto.providerType,
        providerConfigJson: dto.providerConfigJson,
        syncConfigJson: dto.syncConfigJson,
        isDefault: dto.isDefault,
        isActive: dto.isActive,
        isConnected: dto.isConnected,
        lastSyncAt: dto.lastSyncAt ? BigInt(dto.lastSyncAt) : null,
        lastSyncVersionJson: dto.lastSyncVersionJson,
        lastSyncResult: dto.lastSyncResult,
        historyStatsJson: dto.historyStatsJson,
        createdAt: BigInt(dto.createdAt),
        updatedAt: BigInt(dto.updatedAt),
      },
      update: {
        name: dto.name,
        description: dto.description,
        providerType: dto.providerType,
        providerConfigJson: dto.providerConfigJson,
        syncConfigJson: dto.syncConfigJson,
        isDefault: dto.isDefault,
        isActive: dto.isActive,
        isConnected: dto.isConnected,
        lastSyncAt: dto.lastSyncAt ? BigInt(dto.lastSyncAt) : null,
        lastSyncVersionJson: dto.lastSyncVersionJson,
        lastSyncResult: dto.lastSyncResult,
        historyStatsJson: dto.historyStatsJson,
        updatedAt: BigInt(dto.updatedAt),
      },
    });
  }

  async findByUuid(uuid: string): Promise<SyncProfile | null> {
    const record = await this.prisma.syncProfile.findFirst({
      where: {
        uuid,
        accountUuid: this.accountUuid,
      },
    });
    if (!record) return null;
    return SyncProfile.fromPersistenceDTO(toPersistenceDTO(record));
  }

  async findDefault(): Promise<SyncProfile | null> {
    const record = await this.prisma.syncProfile.findFirst({
      where: {
        accountUuid: this.accountUuid,
        isDefault: true,
      },
    });
    if (!record) return null;
    return SyncProfile.fromPersistenceDTO(toPersistenceDTO(record));
  }

  async findAll(): Promise<SyncProfile[]> {
    const records = await this.prisma.syncProfile.findMany({
      where: { accountUuid: this.accountUuid },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r: unknown) => SyncProfile.fromPersistenceDTO(toPersistenceDTO(r)));
  }

  async findActive(): Promise<SyncProfile[]> {
    const records = await this.prisma.syncProfile.findMany({
      where: {
        accountUuid: this.accountUuid,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r: unknown) => SyncProfile.fromPersistenceDTO(toPersistenceDTO(r)));
  }

  async findByQuery(accountUuid: string, options: SyncProfileQueryOptions): Promise<SyncProfile[]> {
    const records = await this.prisma.syncProfile.findMany({
      where: {
        accountUuid: accountUuid,
        ...(options.providerType && { providerType: options.providerType }),
        ...(options.isActive !== undefined && { isActive: options.isActive }),
      },
      orderBy: { createdAt: 'desc' },
      skip: options.offset,
      take: options.limit,
    });
    return records.map((r: unknown) => SyncProfile.fromPersistenceDTO(toPersistenceDTO(r)));
  }

  async count(accountUuid: string, options?: SyncProfileQueryOptions): Promise<number> {
    return this.prisma.syncProfile.count({
      where: {
        accountUuid: accountUuid,
        ...(options?.providerType && { providerType: options.providerType }),
        ...(options?.isActive !== undefined && { isActive: options.isActive }),
      },
    });
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.syncProfile.delete({
      where: { uuid },
    });
  }

  async existsByName(name: string, excludeUuid?: string): Promise<boolean> {
    const count = await this.prisma.syncProfile.count({
      where: {
        accountUuid: this.accountUuid,
        name,
        ...(excludeUuid && { uuid: { not: excludeUuid } }),
      },
    });
    return count > 0;
  }
}
