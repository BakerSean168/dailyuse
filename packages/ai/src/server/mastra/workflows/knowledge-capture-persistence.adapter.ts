import { error, ok, type Result } from '@memoflow/contracts/result';
import type { IKnowledgeNotePersistencePort } from '../../application/ports';
import type {
  KnowledgeCaptureMutationPort,
  SaveKnowledgeNoteResult,
} from './knowledge-note-mutation.port';

/**
 * Canonical bridge from the durable knowledge.capture workflow to the existing
 * application-owned knowledge-note persistence port. Workflow identity/revision
 * become the confirmation/idempotency metadata expected by the host adapter.
 */
export class KnowledgeCapturePersistenceAdapter implements KnowledgeCaptureMutationPort {
  constructor(private readonly persistence: IKnowledgeNotePersistencePort) {}

  async saveKnowledgeNote(
    input: Parameters<KnowledgeCaptureMutationPort['saveKnowledgeNote']>[0],
  ): Promise<Result<SaveKnowledgeNoteResult>> {
    try {
      const persisted = await this.persistence.createKnowledgeNote({
        identityId: input.context.identityId,
        context: input.context,
        fileName: input.fileName,
        path: input.path,
        content: input.content,
        proposalId: input.workflowRunId,
        proposalRevision: input.revision,
        requestId: input.requestId,
      });
      return ok({
        noteId: persisted.note.id,
        notePath: persisted.note.path,
        noteName: persisted.note.name,
      });
    } catch (cause) {
      return error(
        'INTERNAL_ERROR',
        cause instanceof Error ? cause.message : 'Knowledge note persistence failed',
      );
    }
  }
}
