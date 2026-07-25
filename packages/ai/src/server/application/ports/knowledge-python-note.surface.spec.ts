import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 218: Python ai-service knowledge types use Note naming after TS
 * residuals 213–214. Wire keys resource/indexed_resource/related_resources/
 * indexed_resources and protocol resource_id/resource_path stay stable.
 */
describe('AI service Python knowledge note surface', () => {
  const repoRoot = resolve(__dirname, '../../../../../../');
  const knowledgePy = readFileSync(
    resolve(repoRoot, 'apps/ai-service/src/ai_service/schemas/knowledge.py'),
    'utf8',
  );
  const schemasInit = readFileSync(
    resolve(repoRoot, 'apps/ai-service/src/ai_service/schemas/__init__.py'),
    'utf8',
  );
  const queryService = readFileSync(
    resolve(repoRoot, 'apps/ai-service/src/ai_service/services/knowledge_query_service.py'),
    'utf8',
  );
  const inputParsing = readFileSync(
    resolve(repoRoot, 'apps/ai-service/src/ai_service/orchestrator/handlers/input_parsing.py'),
    'utf8',
  );
  const ingestionAdapter = readFileSync(
    resolve(
      __dirname,
      '../../infrastructure/chat-execution/ai-service-knowledge-ingestion.adapter.ts',
    ),
    'utf8',
  );

  it('schemas export Note-named document/index types', () => {
    expect(knowledgePy).toContain('class KnowledgeNoteDocument');
    expect(knowledgePy).toContain('class IndexedKnowledgeNote');
    expect(knowledgePy).toContain('class KnowledgeIndexNoteRequest');
    expect(knowledgePy).toContain('class KnowledgeIndexNoteResponse');
    expect(knowledgePy).not.toContain('KnowledgeResourceDocument');
    expect(knowledgePy).not.toContain('IndexedKnowledgeResource');
    expect(knowledgePy).not.toContain('KnowledgeIndexResourceRequest');
    expect(knowledgePy).not.toContain('KnowledgeIndexResourceResponse');
    expect(schemasInit).toContain('KnowledgeNoteDocument');
    expect(schemasInit).toContain('IndexedKnowledgeNote');
    expect(schemasInit).not.toContain('KnowledgeResourceDocument');
    expect(schemasInit).not.toContain('IndexedKnowledgeResource');
  });

  it('keeps wire keys resource/indexed_resource and protocol resource_id/path', () => {
    expect(knowledgePy).toMatch(/resource:\s*KnowledgeNoteDocument/);
    expect(knowledgePy).toMatch(/indexed_resource:\s*IndexedKnowledgeNote/);
    expect(knowledgePy).toContain('related_resources: list[KnowledgeNoteDocument]');
    expect(knowledgePy).toContain('indexed_resources: list[IndexedKnowledgeNote]');
    expect(knowledgePy).toContain('resource_id: str');
    expect(knowledgePy).toContain('resource_path: str');
  });

  it('indexing service and parsers use note method names', () => {
    expect(queryService).toContain('def index_note(');
    expect(queryService).toContain('async def index_note_async(');
    expect(queryService).not.toContain('def index_resource(');
    expect(queryService).not.toContain('def index_resource_async(');
    expect(inputParsing).toContain('def parse_knowledge_note(');
    expect(inputParsing).toContain('def parse_knowledge_note_list(');
    expect(inputParsing).not.toContain('parse_knowledge_resource');
  });

  it('TS ingestion adapter maps indexed_resource wire to KnowledgeIndexedNote', () => {
    expect(ingestionAdapter).toContain('AIServiceIndexedKnowledgeNoteResponse');
    expect(ingestionAdapter).toContain('indexed_resource: AIServiceIndexedKnowledgeNoteResponse');
    expect(ingestionAdapter).toContain("path: '/internal/workflows/knowledge-index'");
    expect(ingestionAdapter).toContain('resource: {');
    expect(ingestionAdapter).not.toContain('AIServiceIndexedKnowledgeResourceResponse');
    expect(ingestionAdapter).not.toContain('indexResource');
  });
});
