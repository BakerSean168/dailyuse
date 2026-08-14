/**
 * Knowledge repository connection service port.
 * 知识仓储连接服务 Port。
 *
 * Narrow application seam that `RepositoryModuleDependencies` consumes instead
 * of the concrete `KnowledgeRepositoryConnectionService` class, so the deep
 * module never depends on the concrete service type through type declaration.
 *
 * `RepositoryModuleDependencies` 消费的窄应用 seam，替代具体
 * `KnowledgeRepositoryConnectionService` 类，使深层模块不通过类型声明依赖具体服务类型。
 */

import type { Result } from '@memoflow/contracts/result';
import type {
  CompleteKnowledgeRepositoryInstallationReq,
  CompleteKnowledgeRepositoryInstallationRes,
  ConfirmKnowledgeRepositoryHeadReq,
  CreateKnowledgeRepositoryConnectionReq,
  KnowledgeRepositoryConnectionClientDTO,
  KnowledgeRepositoryReconciliationPreview,
  ListKnowledgeRepositoryConnectionsRes,
  PreviewKnowledgeRepositoryReconciliationReq,
  StartKnowledgeRepositoryInstallationReq,
  StartKnowledgeRepositoryInstallationRes,
} from '@memoflow/contracts/repository';

export interface IKnowledgeRepositoryConnectionService {
  startInstallation(
    identityId: string,
    request: StartKnowledgeRepositoryInstallationReq,
  ): Promise<Result<StartKnowledgeRepositoryInstallationRes>>;
  completeInstallation(
    identityId: string,
    request: CompleteKnowledgeRepositoryInstallationReq,
  ): Promise<Result<CompleteKnowledgeRepositoryInstallationRes>>;
  connect(
    identityId: string,
    request: CreateKnowledgeRepositoryConnectionReq,
  ): Promise<Result<KnowledgeRepositoryConnectionClientDTO>>;
  list(identityId: string): Promise<Result<ListKnowledgeRepositoryConnectionsRes>>;
  disconnect(
    identityId: string,
    connectionId: string,
    purgeCloudData?: boolean,
  ): Promise<Result<null>>;
  issueInstallationToken(
    identityId: string,
    connectionId: string,
  ): Promise<Result<{ token: string; expiresAt: number; repositoryId: string }>>;
  previewFirstReconciliation(
    identityId: string,
    connectionId: string,
    request: PreviewKnowledgeRepositoryReconciliationReq,
  ): Promise<Result<KnowledgeRepositoryReconciliationPreview>>;
  confirmHead(
    identityId: string,
    connectionId: string,
    request: ConfirmKnowledgeRepositoryHeadReq,
  ): Promise<Result<KnowledgeRepositoryConnectionClientDTO>>;
}
