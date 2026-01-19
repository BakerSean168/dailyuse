import type { PrismaClient, folder as PrismaFolder } from '@prisma/client';
import type { IFolderRepository } from '@dailyuse/domain-server/repository';
import { Folder } from '@dailyuse/domain-server/repository';

export class PrismaFolderRepository implements IFolderRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 将 Prisma 模型映射为领域实体
   * Prisma 字段为 camelCase
   */
  private mapToEntity(data: PrismaFolder): Folder {
    return Folder.fromPersistenceDTO({
      uuid: data.uuid,
      repositoryUuid: data.repositoryUuid,
      parentUuid: data.parentUuid,
      name: data.name,
      path: data.path,
      order: data.order,
      isExpanded: data.isExpanded,
      metadata: typeof data.metadata === 'string' ? data.metadata : JSON.stringify(data.metadata ?? {}),
      createdAt: Number(data.createdAt), // BigInt → number
      updatedAt: Number(data.updatedAt), // BigInt → number
    });
  }

  async save(folder: Folder): Promise<void> {
    const persistence = folder.toPersistenceDTO();
    const data = {
      repositoryUuid: persistence.repositoryUuid,
      parentUuid: persistence.parentUuid,
      name: persistence.name,
      path: persistence.path,
      order: persistence.order,
      isExpanded: persistence.isExpanded,
      metadata: JSON.parse(persistence.metadata), // string → Json
      updatedAt: BigInt(persistence.updatedAt), // number → BigInt
    };

    await this.prisma.folder.upsert({
      where: { uuid: persistence.uuid },
      create: {
        uuid: persistence.uuid,
        createdAt: BigInt(persistence.createdAt), // number → BigInt
        ...data,
      },
      update: data,
    });
  }

  async findByUuid(uuid: string): Promise<Folder | null> {
    const data = await this.prisma.folder.findUnique({
      where: { uuid },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async findByRepositoryUuid(repositoryUuid: string): Promise<Folder[]> {
    const data = await this.prisma.folder.findMany({
      where: { repositoryUuid },
      orderBy: [
        { path: 'asc' },
        { order: 'asc' },
      ],
    });
    return data.map((d) => this.mapToEntity(d));
  }

  async findByParentUuid(parentUuid: string): Promise<Folder[]> {
    const data = await this.prisma.folder.findMany({
      where: { parentUuid },
      orderBy: { order: 'asc' },
    });
    return data.map((d) => this.mapToEntity(d));
  }

  async findRootFolders(repositoryUuid: string): Promise<Folder[]> {
    const data = await this.prisma.folder.findMany({
      where: {
        repositoryUuid,
        parentUuid: null,
      },
      orderBy: { order: 'asc' },
    });
    return data.map((d) => this.mapToEntity(d));
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.folder.delete({
      where: { uuid },
    });
  }

  async deleteByRepositoryUuid(repositoryUuid: string): Promise<void> {
    await this.prisma.folder.deleteMany({
      where: { repositoryUuid },
    });
  }

  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.folder.count({
      where: { uuid },
    });
    return count > 0;
  }
}
