import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import { IndexStatus } from '@dailyuse/contracts/editor';
import type { Document } from '../../../domain-server/entities/document';
import type { IDocumentRepository } from '../../../domain-server/repositories/IDocumentRepository';
import { PowerSyncDocumentMapper, type PowerSyncDocumentRow } from './powersync-document.mapper';

export class PowerSyncDocumentRepository implements IDocumentRepository {
  constructor(private readonly db: IElectronDatabase) {}

  async findById(id: string): Promise<Document | null> {
    const row = await this.db.getOptional<PowerSyncDocumentRow>(
      'SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [id],
    );
    return row ? PowerSyncDocumentMapper.toDomain(row) : null;
  }

  async findByWorkspaceId(workspaceId: string): Promise<Document[]> {
    const rows = await this.db.getAll<PowerSyncDocumentRow>(
      'SELECT * FROM documents WHERE identity_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC',
      [workspaceId],
    );
    return rows.map((row) => PowerSyncDocumentMapper.toDomain(row));
  }

  async findByPath(workspaceId: string, path: string): Promise<Document | null> {
    const row = await this.db.getOptional<PowerSyncDocumentRow>(
      'SELECT * FROM documents WHERE identity_id = ? AND folder_path = ? AND deleted_at IS NULL LIMIT 1',
      [workspaceId, path],
    );
    return row ? PowerSyncDocumentMapper.toDomain(row) : null;
  }

  async findByContentHash(contentHash: string): Promise<Document[]> {
    const rows = await this.db.getAll<PowerSyncDocumentRow>(
      'SELECT * FROM documents WHERE deleted_at IS NULL',
    );
    return rows
      .map((row) => PowerSyncDocumentMapper.toDomain(row))
      .filter((doc) => doc.contentHash === contentHash);
  }

  async findDocumentsNeedingIndex(workspaceId: string): Promise<Document[]> {
    const docs = await this.findByWorkspaceId(workspaceId);
    return docs.filter(
      (doc) => doc.indexStatus === IndexStatus.Outdated || doc.indexStatus === IndexStatus.Failed,
    );
  }

  async findByIndexStatus(workspaceId: string, status: IndexStatus): Promise<Document[]> {
    const docs = await this.findByWorkspaceId(workspaceId);
    return docs.filter((doc) => doc.indexStatus === status);
  }

  async findRecentlyModified(workspaceId: string, limit: number): Promise<Document[]> {
    const rows = await this.db.getAll<PowerSyncDocumentRow>(
      'SELECT * FROM documents WHERE identity_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT ?',
      [workspaceId, limit],
    );
    return rows.map((row) => PowerSyncDocumentMapper.toDomain(row));
  }

  async save(document: Document): Promise<void> {
    const data = PowerSyncDocumentMapper.toPersistence(document);
    const existing = await this.db.getOptional<{ id: string }>(
      'SELECT id FROM documents WHERE id = ? LIMIT 1',
      [data.id],
    );

    if (existing) {
      await this.db.execute(
        `UPDATE documents
         SET identity_id = ?, title = ?, content = ?, folder_path = ?, tags = ?, status = ?,
             last_versioned_at = ?, last_edited_at = ?, updated_at = ?
         WHERE id = ?`,
        [
          data.identity_id,
          data.title,
          data.content,
          data.folder_path,
          data.tags,
          data.status,
          data.last_versioned_at,
          data.last_edited_at,
          data.updated_at,
          data.id,
        ],
      );
      return;
    }

    await this.db.execute(
      `INSERT INTO documents (
         id, identity_id, title, content, folder_path, tags, status,
         current_version, version, created_at, updated_at, last_versioned_at, last_edited_at, deleted_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?, ?, ?, NULL)`,
      [
        data.id,
        data.identity_id,
        data.title,
        data.content,
        data.folder_path,
        data.tags,
        data.status,
        data.created_at,
        data.updated_at,
        data.last_versioned_at,
        data.last_edited_at,
      ],
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.execute('DELETE FROM documents WHERE id = ?', [id]);
  }

  async saveBatch(documents: Document[]): Promise<void> {
    await this.db.writeTransaction(async () => {
      for (const document of documents) {
        await this.save(document);
      }
    });
  }

  async deleteByWorkspaceId(workspaceId: string): Promise<void> {
    await this.db.execute('DELETE FROM documents WHERE identity_id = ?', [workspaceId]);
  }

  async countByWorkspaceId(workspaceId: string): Promise<number> {
    const row = await this.db.getOptional<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM documents WHERE identity_id = ? AND deleted_at IS NULL',
      [workspaceId],
    );
    return Number(row?.cnt ?? 0);
  }

  async countDocumentsNeedingIndex(workspaceId: string): Promise<number> {
    const docs = await this.findDocumentsNeedingIndex(workspaceId);
    return docs.length;
  }
}
