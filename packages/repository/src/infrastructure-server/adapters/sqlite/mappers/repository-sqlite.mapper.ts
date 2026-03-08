import type { RepositoryStatus } from '@dailyuse/contracts/repository';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { Repository, type RepositoryState } from '../../../../domain-server/aggregates/repository';
import { RepositoryConfig } from '../../../../domain-shared/value-objects/repository-config';
import { RepositoryId } from '../../../../domain-shared/value-objects/repository-id';
import { RepositoryStats } from '../../../../domain-shared/value-objects/repository-stats';

export class RepositorySqliteMapper {
  static toDomain(row: any): Repository {
    const config = row.config ?? JSON.stringify(RepositoryConfig.createDefault().toDTO());
    const stats = row.stats ?? JSON.stringify(RepositoryStats.createEmpty().toDTO());

    const state: RepositoryState = {
      id: RepositoryId.of(row.id),
      identityId: IdentityId.of(row.identity_id),
      name: row.name,
      description: row.description,
      type: row.type,
      path: row.path ?? null,
      status: row.status as RepositoryStatus,
      config: RepositoryConfig.fromDTO(JSON.parse(config)),
      stats: RepositoryStats.fromDTO(JSON.parse(stats)),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      version: row.version ?? 1,
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    };

    return Repository.load(state);
  }
}
