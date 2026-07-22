import { createHash } from 'node:crypto';
import type { IKnowledgeSourcePort, KnowledgeSourceNote } from '@dailyuse/ai/ports';
import type { LocalVaultNoteDTO, LocalVaultNoteSummaryDTO } from '@dailyuse/contracts/repository';
import type { LocalVaultElectronPort } from '@dailyuse/repository/electron';

function resourceIdForPath(relativePath: string): string {
  return `local-vault-${createHash('sha256').update(relativePath).digest('hex').slice(0, 24)}`;
}

/** Local Vault is the only Desktop knowledge source; disconnected Vaults return no cloud fallback. */
export class DesktopKnowledgeSourceAdapter implements IKnowledgeSourcePort {
  constructor(private readonly localVault: LocalVaultElectronPort) {}

  async listRelevantNotes(
    identityId: string,
    query: string,
    limit: number,
  ): Promise<KnowledgeSourceNote[]> {
    const binding = await this.localVault.getBinding(identityId);
    if (!binding || binding.status !== 'Active') return [];

    const summaries = query.trim()
      ? (await this.localVault.searchVault(identityId, { query, limit })).results.map(
          (result) => result.note,
        )
      : (await this.localVault.scanVault(identityId)).notes.slice(0, limit);
    return this.hydrate(identityId, binding.id, summaries.slice(0, limit));
  }

  async listIndexableNotes(
    identityId: string,
    limit: number,
  ): Promise<KnowledgeSourceNote[]> {
    const binding = await this.localVault.getBinding(identityId);
    if (!binding || binding.status !== 'Active') return [];
    const scanned = await this.localVault.scanVault(identityId);
    return this.hydrate(identityId, binding.id, scanned.notes.slice(0, limit));
  }

  async getNoteById(
    identityId: string,
    resourceId: string,
  ): Promise<KnowledgeSourceNote | null> {
    const binding = await this.localVault.getBinding(identityId);
    if (!binding || binding.status !== 'Active') return null;
    const scanned = await this.localVault.scanVault(identityId);
    const summary = scanned.notes.find(
      (note) => resourceIdForPath(note.relativePath) === resourceId,
    );
    if (!summary) return null;
    const note = await this.localVault.readNote(identityId, {
      relativePath: summary.relativePath,
    });
    return this.toKnowledgeNote(identityId, binding.id, note);
  }

  private async hydrate(
    identityId: string,
    repositoryId: string,
    summaries: LocalVaultNoteSummaryDTO[],
  ): Promise<KnowledgeSourceNote[]> {
    return Promise.all(
      summaries.map(async (summary) =>
        this.toKnowledgeNote(
          identityId,
          repositoryId,
          await this.localVault.readNote(identityId, {
            relativePath: summary.relativePath,
          }),
        ),
      ),
    );
  }

  private toKnowledgeNote(
    identityId: string,
    repositoryId: string,
    note: LocalVaultNoteDTO,
  ): KnowledgeSourceNote {
    return {
      identityId,
      repositoryId,
      resourceId: resourceIdForPath(note.relativePath),
      resourcePath: note.relativePath,
      title: note.title,
      mimeType: 'text/markdown',
      content: note.contentMarkdown,
      metadata: {
        ...note.frontmatter,
        tags: note.tags,
        outgoingLinks: note.outgoingLinks,
        contentDigest: createHash('sha256').update(note.contentMarkdown).digest('hex'),
      },
    };
  }
}
