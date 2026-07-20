import { createHash } from 'node:crypto';
import {
  ResourceStatus,
  ResourceType,
  type ResourceClientDTO,
} from '@dailyuse/contracts/repository';
import type { RepositoryApplicationPort } from '@dailyuse/repository';
import type {
  CreateKnowledgeNotePersistenceInput,
  CreateKnowledgeNotePersistenceResult,
  IKnowledgeNotePersistencePort,
} from '@dailyuse/ai/ports';

/**
 * Server AI knowledge-note persistence.
 *
 * A generated note is committed through the Repository application port after
 * the immutable Agent confirmation metadata has been supplied. The returned
 * legacy ResourceClientDTO is a compatibility view over the projection; this
 * adapter never creates or updates a row in the old Resource table.
 */
export class RepositoryKnowledgeNotePersistenceAdapter implements IKnowledgeNotePersistencePort {
  constructor(private readonly repositoryApi: RepositoryApplicationPort) {}

  async createKnowledgeNote(
    input: CreateKnowledgeNotePersistenceInput,
  ): Promise<CreateKnowledgeNotePersistenceResult> {
    if (!input.proposalId || !input.proposalRevision || !input.requestId) {
      throw new Error('A confirmed knowledge-note proposal is required for GitHub writes');
    }

    const connections = await this.repositoryApi.listKnowledgeRepositoryConnections({
      identityId: input.identityId,
      deviceId: 'api-server',
    });
    if (!connections.ok) {
      throw new Error(connections.error.message);
    }

    const activeConnections = connections.data.connections.filter(
      (connection) => connection.status === 'Active',
    );
    const connection = input.connectionId
      ? activeConnections.find((candidate) => candidate.id === input.connectionId)
      : activeConnections.length === 1
        ? activeConnections[0]
        : undefined;

    if (!connection) {
      throw new Error(
        input.connectionId
          ? 'The selected knowledge repository connection is not active'
          : activeConnections.length > 1
            ? 'An explicit knowledge repository connection is required'
            : 'No active knowledge repository connection is available',
      );
    }

    const committed = await this.repositoryApi.createConfirmedKnowledgeNote(
      { identityId: input.identityId, deviceId: 'api-server' },
      {
        connectionId: connection.id,
        proposalId: input.proposalId,
        revision: input.proposalRevision,
        requestId: input.requestId,
        proposedPath: input.path,
        title: input.fileName.replace(/\.md$/i, ''),
        frontmatter: {},
        content: input.content,
        reason: 'AI knowledge note approved by the user',
      },
    );
    if (!committed.ok) {
      throw new Error(committed.error.message);
    }

    return {
      resource: toProjectionResourceDTO(input, connection.id),
    };
  }
}

function toProjectionResourceDTO(
  input: CreateKnowledgeNotePersistenceInput,
  connectionId: string,
): ResourceClientDTO {
  const now = Date.now();
  const id = `knowledge-note-${createHash('sha256')
    .update(`${connectionId}:${input.path}`)
    .digest('hex')}`;
  const wordCount = input.content.split(/\s+/).filter(Boolean).length;

  return {
    id: id as ResourceClientDTO['id'],
    repositoryId: connectionId as ResourceClientDTO['repositoryId'],
    folderId: null,
    name: input.fileName,
    type: ResourceType.File,
    mimeType: 'text/markdown',
    path: input.path,
    size: Buffer.byteLength(input.content, 'utf8'),
    content: input.content,
    metadata: {
      tags: [],
      wordCount,
      readingTime: null,
      thumbnail: null,
      sourceType: 'github-default-branch-projection',
      connectionId,
    },
    stats: {
      viewCount: 0,
      editCount: 0,
      linkCount: 0,
      lastViewedAt: null,
      lastEditedAt: now,
    },
    status: ResourceStatus.Active,
    createdAt: now as ResourceClientDTO['createdAt'],
    updatedAt: now as ResourceClientDTO['updatedAt'],
    deletedAt: null,
    version: 1,
    isDeleted: false,
    isArchived: false,
    isActive: true,
    isDraft: false,
    extension: '.md',
    icon: 'description',
  };
}
