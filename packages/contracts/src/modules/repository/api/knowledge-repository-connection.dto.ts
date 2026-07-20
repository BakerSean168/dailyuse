/**
 * Knowledge repository connection API contracts (GitHub App install — not login OAuth).
 * 知识仓库连接 API 契约（GitHub App 安装授权，不是登录 OAuth）。
 */

import { z } from 'zod';
import type { IdentityId } from '../../../primitives';
import { brandedId } from '../../../primitives';
import type { KnowledgeRepositoryConnectionClientDTO } from '../aggregates/knowledge-repository-connection';

export const KnowledgeRepositoryConnectionStatusSchema = z.enum([
  'PendingInstall',
  'Active',
  'Suspended',
  'Revoked',
  'Error',
]);

export const KnowledgeRepositoryLifecycleErrorCodes = {
  InstallationNotFound: 'GITHUB_INSTALLATION_NOT_FOUND',
  InstallationSuspended: 'GITHUB_INSTALLATION_SUSPENDED',
  ContentsPermissionRequired: 'GITHUB_CONTENTS_PERMISSION_REQUIRED',
  RepositoryAccessLost: 'GITHUB_REPOSITORY_ACCESS_LOST',
  RepositoryPublic: 'GITHUB_REPOSITORY_PUBLIC',
  RepositoryArchived: 'GITHUB_REPOSITORY_ARCHIVED',
  RepositoryDisabled: 'GITHUB_REPOSITORY_DISABLED',
  RepositoryAdminRequired: 'GITHUB_REPOSITORY_ADMIN_REQUIRED',
  DefaultBranchChanged: 'GITHUB_DEFAULT_BRANCH_CHANGED',
  CheckUnavailable: 'GITHUB_LIFECYCLE_CHECK_UNAVAILABLE',
} as const;

export type KnowledgeRepositoryLifecycleErrorCode =
  (typeof KnowledgeRepositoryLifecycleErrorCodes)[keyof typeof KnowledgeRepositoryLifecycleErrorCodes];

export const StartKnowledgeRepositoryInstallationSchema = z.object({
  returnUrl: z.string().url().optional(),
});

export type StartKnowledgeRepositoryInstallationReq = z.infer<
  typeof StartKnowledgeRepositoryInstallationSchema
>;

export interface StartKnowledgeRepositoryInstallationRes {
  installationUrl: string;
  expiresAt: number;
}

export interface GitHubInstallationRepositoryDTO {
  id: string;
  nodeId: string;
  fullName: string;
  ownerId: string;
  private: boolean;
  archived: boolean;
  disabled: boolean;
  defaultBranch: string;
  permissions: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
}

export const GitHubInstallationRepositorySchema = z.object({
  id: z.string().min(1),
  nodeId: z.string(),
  fullName: z.string().min(1),
  ownerId: z.string().min(1),
  private: z.boolean(),
  archived: z.boolean(),
  disabled: z.boolean(),
  defaultBranch: z.string().min(1),
  permissions: z.object({
    admin: z.boolean(),
    push: z.boolean(),
    pull: z.boolean(),
  }),
});

export const StartKnowledgeRepositoryInstallationResponseSchema = z.object({
  installationUrl: z.string().url(),
  expiresAt: z.number(),
});

export const CompleteKnowledgeRepositoryInstallationSchema = z.object({
  state: z.string().min(16),
  installationId: z.string().min(1),
  setupAction: z.enum(['install', 'update']).optional(),
});

export type CompleteKnowledgeRepositoryInstallationReq = z.infer<
  typeof CompleteKnowledgeRepositoryInstallationSchema
>;

export interface CompleteKnowledgeRepositoryInstallationRes {
  installationId: string;
  githubAccountId: string;
  repositories: GitHubInstallationRepositoryDTO[];
  returnUrl: string | null;
}

export const CompleteKnowledgeRepositoryInstallationResponseSchema = z.object({
  installationId: z.string().min(1),
  githubAccountId: z.string().min(1),
  repositories: z.array(GitHubInstallationRepositorySchema),
  returnUrl: z.string().nullable(),
});

export const CreateKnowledgeRepositoryConnectionSchema = z.object({
  installationId: z.string().min(1),
  /** Numeric repository id selected from the server-verified installation inventory. */
  githubRepositoryId: z.string().min(1),
});

export type CreateKnowledgeRepositoryConnectionReq = z.infer<
  typeof CreateKnowledgeRepositoryConnectionSchema
>;
export type CreateKnowledgeRepositoryConnectionRes = KnowledgeRepositoryConnectionClientDTO;

export const KnowledgeRepositoryConnectionClientSchema = z.object({
  id: z.string().min(1),
  identityId: brandedId<IdentityId>(),
  githubUserId: z.string().min(1),
  githubRepositoryId: z.string().min(1),
  githubRepositoryFullName: z.string().min(1),
  installationId: z.string().min(1),
  defaultBranch: z.string().min(1),
  status: KnowledgeRepositoryConnectionStatusSchema,
  lastSyncedCommitSha: z.string().nullable(),
  lastProjectedCommitSha: z.string().nullable().optional(),
  lastErrorCode: z.string().nullable(),
  canSync: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const ListKnowledgeRepositoryConnectionsResSchema = z.object({
  connections: z.array(KnowledgeRepositoryConnectionClientSchema),
});

export type ListKnowledgeRepositoryConnectionsRes = {
  connections: KnowledgeRepositoryConnectionClientDTO[];
};

export const KnowledgeRepositoryConnectionParamsSchema = z.object({
  connectionId: z.string().min(1),
});

export const DisconnectKnowledgeRepositoryConnectionSchema =
  KnowledgeRepositoryConnectionParamsSchema.extend({
    purgeCloudData: z.boolean().default(false),
  });

export type DisconnectKnowledgeRepositoryConnectionReq = z.infer<
  typeof DisconnectKnowledgeRepositoryConnectionSchema
>;
export const DisconnectKnowledgeRepositoryConnectionResponseSchema = z.object({
  disconnected: z.literal(true),
});
export type DisconnectKnowledgeRepositoryConnectionRes = z.infer<
  typeof DisconnectKnowledgeRepositoryConnectionResponseSchema
>;

/**
 * Short-lived Git credential returned only to the Desktop runtime.
 * The token is repository-scoped by the GitHub App API and never persisted in client DTOs.
 */
export const KnowledgeRepositoryInstallationTokenSchema = z.object({
  token: z.string().min(1),
  expiresAt: z.number(),
  repositoryId: z.string().min(1),
});

export type KnowledgeRepositoryInstallationTokenRes = z.infer<
  typeof KnowledgeRepositoryInstallationTokenSchema
>;

export const KnowledgeRepositoryContentStateSchema = z.enum(['Empty', 'NonEmpty']);
export type KnowledgeRepositoryContentState = z.infer<typeof KnowledgeRepositoryContentStateSchema>;

export const KnowledgeRepositoryFirstReconciliationActionSchema = z.enum([
  'InitializeRemoteFromLocal',
  'CloneRemoteIntoLocal',
  'InitializeBoth',
  'ManualResolutionRequired',
]);
export type KnowledgeRepositoryFirstReconciliationAction = z.infer<
  typeof KnowledgeRepositoryFirstReconciliationActionSchema
>;

/**
 * Desktop reports only the local content shape. The server independently
 * revalidates the identity-owned connection and reads the GitHub default branch.
 */
export const PreviewKnowledgeRepositoryReconciliationSchema = z.object({
  localState: KnowledgeRepositoryContentStateSchema,
});
export type PreviewKnowledgeRepositoryReconciliationReq = z.infer<
  typeof PreviewKnowledgeRepositoryReconciliationSchema
>;

export const KnowledgeRepositoryReconciliationPreviewSchema = z.object({
  connectionId: z.string().min(1),
  localState: KnowledgeRepositoryContentStateSchema,
  remoteState: KnowledgeRepositoryContentStateSchema,
  action: KnowledgeRepositoryFirstReconciliationActionSchema,
  defaultBranch: z.string().min(1),
  remoteHeadSha: z.string().nullable(),
});
export type KnowledgeRepositoryReconciliationPreview = z.infer<
  typeof KnowledgeRepositoryReconciliationPreviewSchema
>;

export const KnowledgeRepositoryExecutableReconciliationActionSchema = z.enum([
  'InitializeRemoteFromLocal',
  'CloneRemoteIntoLocal',
  'InitializeBoth',
]);
export type KnowledgeRepositoryExecutableReconciliationAction = z.infer<
  typeof KnowledgeRepositoryExecutableReconciliationActionSchema
>;

export const GitCommitShaSchema = z.string().regex(/^[a-f0-9]{40,64}$/i);

/**
 * Immutable confirmation of the read-only preview that the user approved.
 * Desktop must recompute the preview immediately before executing Git commands.
 */
export const ExecuteKnowledgeRepositoryReconciliationSchema = z.object({
  connectionId: z.string().min(1),
  expectedAction: KnowledgeRepositoryExecutableReconciliationActionSchema,
  expectedDefaultBranch: z.string().min(1),
  expectedRemoteHeadSha: GitCommitShaSchema.nullable(),
});
export type ExecuteKnowledgeRepositoryReconciliationReq = z.infer<
  typeof ExecuteKnowledgeRepositoryReconciliationSchema
>;

/**
 * Desktop reports the commit currently checked out after any Git mutation.
 * The server independently reads the live default-branch HEAD before advancing
 * the shared cursor, so this contract is valid for both first reconciliation
 * and later continuous synchronization.
 */
export const ConfirmKnowledgeRepositoryHeadSchema = z.object({
  headSha: GitCommitShaSchema,
});
export type ConfirmKnowledgeRepositoryHeadReq = z.infer<
  typeof ConfirmKnowledgeRepositoryHeadSchema
>;

export const ExecuteKnowledgeRepositoryReconciliationResponseSchema = z.object({
  connection: KnowledgeRepositoryConnectionClientSchema,
  action: KnowledgeRepositoryExecutableReconciliationActionSchema,
  headSha: GitCommitShaSchema,
  reusedExistingSynchronization: z.boolean(),
});
export type ExecuteKnowledgeRepositoryReconciliationRes = z.infer<
  typeof ExecuteKnowledgeRepositoryReconciliationResponseSchema
>;

export const SyncKnowledgeRepositorySchema = z.object({
  connectionId: z.string().min(1),
});
export type SyncKnowledgeRepositoryReq = z.infer<typeof SyncKnowledgeRepositorySchema>;

export const KnowledgeRepositorySyncOutcomeSchema = z.enum([
  'UpToDate',
  'Pushed',
  'Pulled',
  'RebasedAndPushed',
]);
export type KnowledgeRepositorySyncOutcome = z.infer<typeof KnowledgeRepositorySyncOutcomeSchema>;

export const KnowledgeRepositorySyncConflictContextSchema = z.object({
  localHeadSha: GitCommitShaSchema.nullable(),
  remoteHeadSha: GitCommitShaSchema.nullable(),
  conflictingPaths: z.array(z.string()),
  rebaseInProgress: z.boolean(),
});
export type KnowledgeRepositorySyncConflictContext = z.infer<
  typeof KnowledgeRepositorySyncConflictContextSchema
>;

export const KnowledgeRepositorySyncPendingContextSchema = z.object({
  localHeadSha: GitCommitShaSchema,
  localCommitCreated: z.boolean(),
  uploadPending: z.literal(true),
});
export type KnowledgeRepositorySyncPendingContext = z.infer<
  typeof KnowledgeRepositorySyncPendingContextSchema
>;

export const SyncKnowledgeRepositoryResponseSchema = z.object({
  connection: KnowledgeRepositoryConnectionClientSchema,
  outcome: KnowledgeRepositorySyncOutcomeSchema,
  headSha: GitCommitShaSchema,
  localCommitCreated: z.boolean(),
  remoteChangesApplied: z.boolean(),
  pushed: z.boolean(),
});
export type SyncKnowledgeRepositoryRes = z.infer<typeof SyncKnowledgeRepositoryResponseSchema>;
