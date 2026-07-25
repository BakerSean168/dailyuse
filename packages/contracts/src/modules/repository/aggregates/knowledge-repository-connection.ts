/**
 * KnowledgeRepositoryConnection — GitHub knowledge-vault authorization binding.
 * 知识仓库连接 —— GitHub 知识库授权绑定（与登录 OAuth binding 分离，ADR-034）。
 */

import type { IdentityId, TransferDate } from '../../../primitives';

export type KnowledgeRepositoryConnectionStatus =
  'PendingInstall' | 'Active' | 'Suspended' | 'Revoked' | 'Error';

/**
 * Server DTO for a repository connection owned by an online identity.
 * 在线身份拥有的仓库连接服务端 DTO。
 */
export interface KnowledgeRepositoryConnectionServerDTO {
  id: string;
  identityId: IdentityId;
  /** GitHub user id that authorized the installation (numeric string). */
  githubUserId: string;
  /** GitHub repository node/database id. */
  githubRepositoryId: string;
  githubRepositoryFullName: string;
  installationId: string;
  defaultBranch: string;
  status: KnowledgeRepositoryConnectionStatus;
  /** Last successful reconciliation commit SHA on default branch, if any. */
  lastSyncedCommitSha: string | null;
  /** Last default-branch commit fully ingested into the server read model. */
  lastProjectedCommitSha?: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}

// Residual 803: KnowledgeRepositoryConnectionClientDTO dual retired —
// sole KnowledgeRepositoryConnectionClientSchema + z.infer in api/knowledge-repository-connection.dto.ts
// (exported via @dailyuse/contracts/repository api barrel; ServerDTO remains aggregate-owned).
