import { createHash } from 'node:crypto';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import {
  ResourceStatus,
  ResourceType,
  type LocalVaultNoteDTO,
} from '@dailyuse/contracts/repository';
import type {
  CreateKnowledgeNotePersistenceInput,
  CreateKnowledgeNotePersistenceResult,
  IKnowledgeNotePersistencePort,
} from '@dailyuse/ai/ports';
import type { LocalVaultElectronPort } from '@dailyuse/repository/electron';

/**
 * Desktop AI notes are committed to the selected local Vault only after the
 * Agent approval contract has supplied proposal metadata.
 * Desktop AI 笔记只在 Agent 提供确认提案元数据后写入当前本地 Vault。
 */
export class DesktopKnowledgeNotePersistenceAdapter implements IKnowledgeNotePersistencePort {
  constructor(private readonly localVault: LocalVaultElectronPort) {}

  async createKnowledgeNote(
    input: CreateKnowledgeNotePersistenceInput,
  ): Promise<CreateKnowledgeNotePersistenceResult> {
    if (!input.proposalId || !input.proposalRevision || !input.requestId) {
      throw new Error('A confirmed knowledge-note proposal is required for local Vault writes');
    }

    const result = await this.localVault.writeConfirmedNote(input.identityId, {
      relativePath: input.path,
      contentMarkdown: input.content,
      proposalId: input.proposalId,
      proposalRevision: input.proposalRevision,
      requestId: input.requestId,
    });

    return {
      resource: toResourceDTO(input.identityId, result.note),
    };
  }
}

function toResourceDTO(identityId: string, note: LocalVaultNoteDTO): ResourceClientDTO {
  const id = `local-vault-${createHash('sha256').update(note.relativePath).digest('hex').slice(0, 24)}`;
  const timestamp = Number(note.updatedAt);
  return {
    id: id as ResourceClientDTO['id'],
    repositoryId: `local-vault-${identityId}` as ResourceClientDTO['repositoryId'],
    folderId: null,
    name: note.relativePath.split('/').pop() ?? note.title,
    type: ResourceType.File,
    mimeType: 'text/markdown',
    path: note.relativePath,
    size: note.size,
    content: note.contentMarkdown,
    metadata: {
      tags: note.tags,
      wordCount: note.contentMarkdown.split(/\s+/).filter(Boolean).length,
      readingTime: null,
      thumbnail: null,
      frontmatter: note.frontmatter,
    },
    stats: {
      viewCount: 0,
      editCount: 0,
      linkCount: note.outgoingLinks.length,
      lastViewedAt: null,
      lastEditedAt: timestamp,
    },
    status: ResourceStatus.Active,
    createdAt: timestamp as ResourceClientDTO['createdAt'],
    updatedAt: timestamp as ResourceClientDTO['updatedAt'],
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
