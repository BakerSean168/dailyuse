import type { PrismaClient, repository as PrismaRepository } from '@prisma/client';
import type { IRepositoryRepository } from '@dailyuse/domain-server/repository';
import { Repository } from '@dailyuse/domain-server/repository';
import type { RepositoryServerDTO, ResourceServerDTO, FolderServerDTO } from '@dailyuse/contracts/repository';
import { RepositoryType, RepositoryStatus } from '@dailyuse/contracts/repository';


export class PrismaRepositoryRepository implements IRepositoryRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 将 Prisma 模型映射为领域实体
   * Prisma 字段为 camelCase
   */
  private mapToEntity(data: PrismaRepository): Repository {
    return Repository.fromPersistenceDTO({
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      name: data.name,
      type: data.type as RepositoryType,
      path: data.path,
      description: data.description,
      config: typeof data.config === 'string' ? data.config : JSON.stringify(data.config ?? {}),
      stats: typeof data.stats === 'string' ? data.stats : JSON.stringify(data.stats ?? {}),
      status: data.status as RepositoryStatus,
      createdAt: Number(data.createdAt), // BigInt → number
      updatedAt: Number(data.updatedAt), // BigInt → number
    });
  }

  async save(repository: Repository): Promise<void> {
    const persistence = repository.toPersistenceDTO();
    const data = {
      name: persistence.name,
      type: persistence.type,
      path: persistence.path,
      description: persistence.description,
      config: JSON.parse(persistence.config), // string → Json
      stats: JSON.parse(persistence.stats), // string → Json
      status: persistence.status,
      updatedAt: BigInt(persistence.updatedAt), // number → BigInt
    };

    // 检查是否已存在相同的 (accountUuid, path) 组合
    const existing = await this.prisma.repository.findFirst({
      where: {
        accountUuid: persistence.accountUuid,
        path: persistence.path,
      },
    });

    if (existing) {
      // 更新已存在的仓储
      await this.prisma.repository.update({
        where: { uuid: existing.uuid },
        data,
      });
    } else {
      // 创建新仓储
      await this.prisma.repository.create({
        data: {
          uuid: persistence.uuid,
          accountUuid: persistence.accountUuid,
          createdAt: BigInt(persistence.createdAt), // number → BigInt
          ...data,
        },
      });
    }
  }

  async findByUuid(uuid: string): Promise<Repository | null> {
    const data = await this.prisma.repository.findUnique({
      where: { uuid },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async findByAccountUuid(accountUuid: string): Promise<Repository[]> {
    const data = await this.prisma.repository.findMany({
      where: { accountUuid },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d) => this.mapToEntity(d));
  }

  async findByAccountUuidAndStatus(accountUuid: string, status: RepositoryStatus): Promise<Repository[]> {
    const data = await this.prisma.repository.findMany({
      where: { 
        accountUuid, 
        status 
      },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d) => this.mapToEntity(d));
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.repository.delete({ 
      where: { uuid } 
    });
  }

  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.repository.count({ 
      where: { uuid } 
    });
    return count > 0;
  }
}


