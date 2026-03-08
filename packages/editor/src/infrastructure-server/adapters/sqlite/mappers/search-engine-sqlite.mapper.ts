import { SearchEngine } from '../../../../domain-server/entities/search-engine';

export class SearchEngineSqliteMapper {
  static toDomain(row: any): SearchEngine {
    return SearchEngine.load({
      id: row.id,
      workspaceId: row.workspace_id,
      identityId: row.identityId ?? row.identity_id ?? '',
      name: row.name ?? '',
      description: row.description ?? null,
      indexPath: row.index_path ?? '',
      indexedDocumentCount: row.indexed_document_count ?? 0,
      totalDocumentCount: row.total_document_count ?? 0,
      lastIndexedAt: row.last_indexed_at ? new Date(row.last_indexed_at) : null,
      isIndexing: row.is_indexing === 1,
      indexProgress: row.index_progress ?? null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    } as any);
  }
}
