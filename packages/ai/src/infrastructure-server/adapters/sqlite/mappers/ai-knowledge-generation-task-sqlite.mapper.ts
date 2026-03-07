import type { KnowledgeGenerationTask } from '../../../../domain-server/entities/knowledge-generation-task';

export class AiKnowledgeGenerationTaskSqliteMapper {
  static toEntity(row: any): KnowledgeGenerationTask {
    return {
      id: row.id,
      identityId: row.identity_id,
      topic: row.topic,
      documentCount: row.document_count,
      targetAudience: row.target_audience || undefined,
      folderPath: row.folder_path,
      status: row.status,
      progress: row.progress,
      generatedDocumentIds: JSON.parse(row.generated_document_ids || '[]'),
      error: row.error || undefined,
      createdAt: row.created_at,
      completedAt: row.completed_at || undefined,
    };
  }
}
