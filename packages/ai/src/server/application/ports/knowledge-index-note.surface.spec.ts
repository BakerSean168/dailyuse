import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 214: knowledge index/sync layer drops Resource dual-track type and
 * method names after Resource CRUD retirement. Wire keys indexed_resources /
 * related_resources and protocol fields resourceId/resourcePath stay stable.
 */
describe('AI knowledge index note surface', () => {
  const dir = __dirname;
  const ingestion = readFileSync(resolve(dir, 'knowledge-ingestion.port.ts'), 'utf8');
  const index = readFileSync(resolve(dir, 'knowledge-index.port.ts'), 'utf8');
  const helpers = readFileSync(
    resolve(dir, '../use-cases/commands/ai-knowledge-index-helpers.ts'),
    'utf8',
  );
  const syncNotes = readFileSync(
    resolve(dir, '../use-cases/commands/sync-knowledge-notes.use-case.ts'),
    'utf8',
  );
  const queryAdapter = readFileSync(
    resolve(dir, '../../infrastructure/chat-execution/ai-service-knowledge-query.adapter.ts'),
    'utf8',
  );

  it('ports use KnowledgeIndexedNote and note-oriented methods', () => {
    expect(ingestion).toContain('export interface KnowledgeIndexedNote');
    expect(ingestion).toContain('note: KnowledgeSourceNote');
    expect(ingestion).toContain('indexNote(input: KnowledgeIngestionInput)');
    expect(ingestion).not.toContain('KnowledgeIndexedResource');
    expect(ingestion).not.toContain('indexResource');
    expect(index).toContain('findByNoteIds');
    expect(index).toContain('findRelevantNotes');
    expect(index).toContain('removeByNoteId');
    expect(index).not.toContain('findByResourceIds');
    expect(index).not.toContain('findRelevantResources');
    expect(index).not.toContain('removeByResourceId');
  });

  it('sync helpers and use case use note naming', () => {
    expect(helpers).toContain('SyncKnowledgeNotesOptions');
    expect(helpers).toContain('SyncKnowledgeNotesResult');
    expect(helpers).toContain('indexedNotes: KnowledgeIndexedNote[]');
    expect(helpers).toContain('mergeUniqueNotes');
    expect(helpers).not.toContain('SyncKnowledgeResources');
    expect(helpers).not.toContain('indexedResources');
    expect(syncNotes).toContain('export class SyncKnowledgeNotesUseCase');
    expect(syncNotes).toContain('indexNote({');
    expect(syncNotes).toContain('note: resource');
  });

  it('ai-service wire still uses indexed_resources / related_resources keys', () => {
    expect(queryAdapter).toContain('indexed_resources:');
    expect(queryAdapter).toContain('related_resources:');
    expect(queryAdapter).toContain('input.indexedNotes');
  });
});
