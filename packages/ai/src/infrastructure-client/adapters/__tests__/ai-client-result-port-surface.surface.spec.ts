import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * AI client Result-port completion surface (stage-6 residual 101):
 * All transport-facing client ports return Promise<Result<T>> except streamMessage
 * (intentionally throw-based SSE/IPC stream control). No dead dual stream port.
 */
describe('ai client result port surface (residual 101)', () => {
  const apiPort = readFileSync(
    resolve(__dirname, '../../../application-client/ports/ai-api-client.port.ts'),
    'utf8',
  );
  const clientPort = readFileSync(
    resolve(__dirname, '../../../application-client/ai-client.port.ts'),
    'utf8',
  );
  const types = readFileSync(resolve(__dirname, '../types.ts'), 'utf8');

  it('does not export a parallel IAIStreamMessageApiClient dual interface', () => {
    expect(apiPort).not.toContain('IAIStreamMessageApiClient');
    expect(types).not.toContain('IAIStreamMessageApiClient');
  });

  it('stream lives only on IAIMessageApiClient / AIClientPort as Promise<void>', () => {
    expect(apiPort).toContain('export interface IAIMessageApiClient');
    expect(apiPort).toContain('streamMessage(');
    expect(apiPort).toContain('): Promise<void>;');
    expect(clientPort).toContain('streamMessage(');
    // send/list are Result
    expect(apiPort).toContain('sendMessage(request: SendMessageReq): Promise<Result<SendMessageRes>>');
    expect(apiPort).toContain('Promise<Result<MessageListRes>>');
  });

  it('remaining client ports are Result-shaped (no throw dual-track signatures)', () => {
    const resultMethods = [
      'getCapabilities(): Promise<Result<AICapabilities>>',
      'Promise<Result<AIProviderConfigClientDTO>>',
      'Promise<Result<AIConversationClientDTO>>',
      'Promise<Result<GenerateGoalsRes>>',
      'Promise<Result<QueryKnowledgeRes>>',
      'Promise<Result<AgentRunResult>>',
      'Promise<Result<QueryAnalyticsRes>>',
    ];
    for (const snippet of resultMethods) {
      expect(apiPort + clientPort).toContain(snippet);
    }
  });
});
