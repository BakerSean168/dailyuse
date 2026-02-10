import type { Repository } from '../aggregates/repository';
import { RepositoryStatus } from '@dailyuse/contracts/repository';

export interface IRepositoryRepository {
  save(repository: Repository): Promise<void>;
  findByUuid(uuid: string): Promise<Repository | null>;
  findByAccountUuid(accountUuid: string): Promise<Repository[]>;
  findByAccountUuidAndStatus(accountUuid: string, status: RepositoryStatus): Promise<Repository[]>;
  delete(uuid: string): Promise<void>;
  exists(uuid: string): Promise<boolean>;
}
