import type { IRepositoryRepository } from '@dailyuse/repository';
import { RepositoryStatus } from '@dailyuse/contracts/repository';

export class DefaultRepositoryResolver {
  constructor(private readonly repositoryRepository: IRepositoryRepository) {}

  async resolve(identityId: string) {
    const repositories = await this.repositoryRepository.findByIdentityIdAndStatus(
      identityId,
      RepositoryStatus.Active,
    );

    const repository =
      repositories[0] ?? (await this.repositoryRepository.findByIdentityId(identityId))[0];
    if (!repository) {
      throw new Error('No repository available for current user');
    }

    return repository;
  }
}
