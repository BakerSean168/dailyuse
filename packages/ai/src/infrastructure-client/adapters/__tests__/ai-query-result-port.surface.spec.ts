import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * AI goal/evaluation/knowledge/analytics Result-port surface (stage-6 residual 98):
 * Transport adapters and application ports return Promise<Result<T>> —
 * no throw-unwrap dual-track at the adapter boundary.
 */
describe('ai query result port surface (goal/eval/knowledge/analytics)', () => {
  const apiPort = readFileSync(
    resolve(__dirname, '../../../application-client/ports/ai-api-client.port.ts'),
    'utf8',
  );
  const clientPort = readFileSync(
    resolve(__dirname, '../../../application-client/ai-client.port.ts'),
    'utf8',
  );

  const adapters = [
    '../http/ai-goal-http.adapter.ts',
    '../ipc/ai-goal-ipc.adapter.ts',
    '../http/ai-evaluation-report-http.adapter.ts',
    '../ipc/ai-evaluation-report-ipc.adapter.ts',
    '../http/ai-knowledge-note-http.adapter.ts',
    '../ipc/ai-knowledge-note-ipc.adapter.ts',
    '../http/ai-knowledge-query-http.adapter.ts',
    '../ipc/ai-knowledge-query-ipc.adapter.ts',
    '../http/ai-analytics-query-http.adapter.ts',
    '../ipc/ai-analytics-query-ipc.adapter.ts',
  ].map((rel) => readFileSync(resolve(__dirname, rel), 'utf8'));

  it('application ports return Promise<Result<...>> for residual 98 methods', () => {
    expect(apiPort).toContain('generateGoal(request: GenerateGoalsReq): Promise<Result<GenerateGoalsRes>>');
    expect(apiPort).toContain('Promise<Result<GetAIEvaluationOverviewRes>>');
    expect(apiPort).toContain('Promise<Result<CreateKnowledgeNoteRes>>');
    expect(apiPort).toContain('expandKnowledge(request: ExpandKnowledgeReq): Promise<Result<ExpandKnowledgeRes>>');
    expect(apiPort).toContain('queryKnowledge(request: QueryKnowledgeReq): Promise<Result<QueryKnowledgeRes>>');
    expect(apiPort).toContain('reindexKnowledge(request: ReindexKnowledgeReq): Promise<Result<ReindexKnowledgeRes>>');
    expect(apiPort).toContain('queryAnalytics(request: QueryAnalyticsReq): Promise<Result<QueryAnalyticsRes>>');

    expect(clientPort).toContain('generateGoal(request: GenerateGoalsReq): Promise<Result<GenerateGoalsRes>>');
    expect(clientPort).toContain('queryKnowledge(request: QueryKnowledgeReq): Promise<Result<QueryKnowledgeRes>>');
    expect(clientPort).toContain('queryAnalytics(request: QueryAnalyticsReq): Promise<Result<QueryAnalyticsRes>>');
  });

  it('HTTP/IPC adapters never unwrapResultOrThrow', () => {
    for (const src of adapters) {
      expect(src).not.toContain('unwrapResultOrThrow');
      expect(src).toContain('Promise<Result<');
    }
  });
});
