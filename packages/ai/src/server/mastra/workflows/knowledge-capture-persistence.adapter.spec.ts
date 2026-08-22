import { describe, expect, it, vi } from 'vitest';
import { KnowledgeCapturePersistenceAdapter } from './knowledge-capture-persistence.adapter';

const context = {
  identityId: 'identity-1',
  requestId: 'request-entry',
  traceId: 'trace-1',
} as never;

describe('KnowledgeCapturePersistenceAdapter', () => {
  it('maps workflow identity/revision into confirmed idempotent note persistence', async () => {
    const createKnowledgeNote = vi.fn(async (input) => ({
      note: {
        id: 'note-1',
        repositoryScopeId: 'repo-1',
        name: input.fileName,
        path: input.path,
        mimeType: 'text/markdown',
        size: input.content.length,
        content: input.content,
        createdAt: 1,
        updatedAt: 1,
      },
    }));
    const adapter = new KnowledgeCapturePersistenceAdapter({ createKnowledgeNote });
    const result = await adapter.saveKnowledgeNote({
      workflowRunId: 'run-1',
      revision: 2,
      path: 'notes/mastra.md',
      fileName: 'mastra.md',
      title: 'Mastra',
      content: '# Mastra',
      requestId: 'run-1:2:knowledge',
      context,
    });
    expect(result).toMatchObject({ ok: true, data: { noteId: 'note-1' } });
    expect(createKnowledgeNote).toHaveBeenCalledWith(
      expect.objectContaining({
        identityId: 'identity-1',
        proposalId: 'run-1',
        proposalRevision: 2,
        requestId: 'run-1:2:knowledge',
      }),
    );
  });
});
