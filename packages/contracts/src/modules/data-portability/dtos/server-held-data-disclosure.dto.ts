/**
 * Server-held Data Disclosure V1
 *
 * This artifact is intentionally distinct from `memoflow.user-data-export`:
 * it is a disclosure of repository-cloud records currently held by the
 * MemoFlow server and must never be accepted by an import route.
 */

import { z } from 'zod';

const NullableStringSchema = z.string().nullable();

export const ServerHeldKnowledgeRepositoryConnectionSchema = z
  .object({
    id: z.string(),
    githubUserId: z.string(),
    githubRepositoryId: z.string(),
    githubRepositoryFullName: z.string(),
    githubInstallationId: z.string(),
    defaultBranch: z.string(),
    isPrivate: z.boolean(),
    status: z.string(),
    lastSyncedCommitSha: NullableStringSchema,
    lastProjectedCommitSha: NullableStringSchema,
    lastErrorCode: NullableStringSchema,
    lastErrorMessage: NullableStringSchema,
    version: z.number().int(),
    createdAt: z.string(),
    updatedAt: z.string(),
    deletedAt: NullableStringSchema,
  })
  .strict();

export const ServerHeldGithubWebhookDeliverySchema = z
  .object({
    id: z.string(),
    connectionId: z.string(),
    deliveryId: z.string(),
    eventName: z.string(),
    beforeSha: NullableStringSchema,
    afterSha: NullableStringSchema,
    forced: z.boolean(),
    status: z.string(),
    errorMessage: NullableStringSchema,
    receivedAt: z.string(),
    processedAt: NullableStringSchema,
  })
  .strict();

export const ServerHeldKnowledgeNoteProjectionSchema = z
  .object({
    id: z.string(),
    connectionId: z.string(),
    relativePath: z.string(),
    commitSha: z.string(),
    blobSha: z.string(),
    contentHash: z.string(),
    frontmatter: z.unknown(),
    markdownContent: z.string(),
    indexStatus: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    deletedAt: NullableStringSchema,
  })
  .strict();

export const ServerHeldKnowledgeAttachmentProjectionSchema = z
  .object({
    id: z.string(),
    connectionId: z.string(),
    relativePath: z.string(),
    commitSha: z.string(),
    blobSha: z.string(),
    byteSize: z.number().int().nullable(),
    mediaType: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    deletedAt: NullableStringSchema,
  })
  .strict();

export const ServerHeldKnowledgeAttachmentContentCacheSchema = z
  .object({
    connectionId: z.string(),
    blobSha: z.string(),
    byteSize: z.number().int().nonnegative(),
    contentBase64: z.string(),
    cachedAt: z.string(),
    expiresAt: z.string(),
  })
  .strict();

export const ServerHeldKnowledgeWriteRequestSchema = z
  .object({
    id: z.string(),
    connectionId: z.string(),
    requestId: z.string(),
    requestHash: z.string(),
    relativePath: z.string(),
    status: z.string(),
    commitSha: NullableStringSchema,
    errorCode: NullableStringSchema,
    errorMessage: NullableStringSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
    completedAt: NullableStringSchema,
  })
  .strict();

export const ServerHeldAiKnowledgeIndexEntrySchema = z
  .object({
    id: z.string(),
    repositoryId: z.string(),
    resourceId: z.string(),
    resourcePath: z.string(),
    title: NullableStringSchema,
    mimeType: z.string(),
    contentHash: z.string(),
    status: z.string(),
    summary: NullableStringSchema,
    keywords: z.unknown(),
    embedding: z.unknown().nullable(),
    chunks: z.unknown().nullable(),
    metadata: z.unknown(),
    error: NullableStringSchema,
    indexedAt: z.string(),
    lastRequestedAt: NullableStringSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
    deletedAt: NullableStringSchema,
  })
  .strict();

export const ServerHeldDataDisclosureDataV1Schema = z
  .object({
    knowledgeRepositoryConnections: z.array(ServerHeldKnowledgeRepositoryConnectionSchema),
    githubWebhookDeliveries: z.array(ServerHeldGithubWebhookDeliverySchema),
    knowledgeNoteProjections: z.array(ServerHeldKnowledgeNoteProjectionSchema),
    knowledgeAttachmentProjections: z.array(ServerHeldKnowledgeAttachmentProjectionSchema),
    knowledgeAttachmentContentCaches: z.array(ServerHeldKnowledgeAttachmentContentCacheSchema),
    knowledgeWriteRequests: z.array(ServerHeldKnowledgeWriteRequestSchema),
    aiKnowledgeIndexEntries: z.array(ServerHeldAiKnowledgeIndexEntrySchema),
  })
  .strict();

export const ServerHeldDataDisclosureEnvelopeV1Schema = z
  .object({
    kind: z.literal('memoflow.server-held-data-disclosure'),
    schemaVersion: z.literal(1),
    disclosedAt: z.string(),
    subject: z
      .object({
        identityId: z.string(),
      })
      .strict(),
    scope: z
      .object({
        importMode: z.literal('not-importable'),
        includesImportableBusinessDataBackup: z.literal(false),
        includesLocalVaultFiles: z.literal(false),
        includesGithubRepositoryHistory: z.literal(false),
        includesApplicationManagedReplayableGithubAuthorization: z.literal(false),
        includesNonReplayableGithubInstallationIdentifiers: z.literal(true),
        includesCachedAttachmentBytes: z.literal(true),
        includesEphemeralWorkerLeases: z.literal(false),
        includesDatabaseInternalRetrievalVector: z.literal(false),
      })
      .strict(),
    data: ServerHeldDataDisclosureDataV1Schema,
  })
  .strict();

export type ServerHeldKnowledgeRepositoryConnection = z.infer<
  typeof ServerHeldKnowledgeRepositoryConnectionSchema
>;
export type ServerHeldGithubWebhookDelivery = z.infer<typeof ServerHeldGithubWebhookDeliverySchema>;
export type ServerHeldKnowledgeNoteProjection = z.infer<
  typeof ServerHeldKnowledgeNoteProjectionSchema
>;
export type ServerHeldKnowledgeAttachmentProjection = z.infer<
  typeof ServerHeldKnowledgeAttachmentProjectionSchema
>;
export type ServerHeldKnowledgeAttachmentContentCache = z.infer<
  typeof ServerHeldKnowledgeAttachmentContentCacheSchema
>;
export type ServerHeldKnowledgeWriteRequest = z.infer<typeof ServerHeldKnowledgeWriteRequestSchema>;
export type ServerHeldAiKnowledgeIndexEntry = z.infer<typeof ServerHeldAiKnowledgeIndexEntrySchema>;
export type ServerHeldDataDisclosureDataV1 = z.infer<typeof ServerHeldDataDisclosureDataV1Schema>;
export type ServerHeldDataDisclosureEnvelopeV1 = z.infer<
  typeof ServerHeldDataDisclosureEnvelopeV1Schema
>;
