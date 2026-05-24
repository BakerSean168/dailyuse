import type { Repository } from '../aggregates/repository';
import { RepositoryStatus } from '@dailyuse/contracts/repository';

export interface IRepositoryRepository {
  save(repository: Repository): Promise<void>;
  findById(id: string): Promise<Repository | null>;
  findByIdentityId(identityId: string): Promise<Repository[]>;
  findByIdentityIdAndStatus(identityId: string, status: RepositoryStatus): Promise<Repository[]>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}
