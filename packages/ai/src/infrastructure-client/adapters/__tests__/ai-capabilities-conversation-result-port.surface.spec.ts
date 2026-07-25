import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * AI capabilities + conversation Result-port surface (stage-6 residual 97):
 * Transport adapters and application ports return Promise<Result<T>> —
 * no throw-unwrap dual-track at the adapter boundary.
 */
describe('ai capabilities + conversation result port surface', () => {
  const apiPort = readFileSync(
    resolve(__dirname, '../../../application-client/ports/ai-api-client.port.ts'),
    'utf8',
  );
  const clientPort = readFileSync(
    resolve(__dirname, '../../../application-client/ai-client.port.ts'),
    'utf8',
  );
  const capsHttp = readFileSync(
    resolve(__dirname, '../http/ai-capabilities-http.adapter.ts'),
    'utf8',
  );
  const capsIpc = readFileSync(
    resolve(__dirname, '../ipc/ai-capabilities-ipc.adapter.ts'),
    'utf8',
  );
  const convHttp = readFileSync(
    resolve(__dirname, '../http/ai-conversation-http.adapter.ts'),
    'utf8',
  );
  const convIpc = readFileSync(
    resolve(__dirname, '../ipc/ai-conversation-ipc.adapter.ts'),
    'utf8',
  );

  it('IAICapabilitiesApiClient and IAIConversationApiClient return Promise<Result<...>>', () => {
    expect(apiPort).toContain(
      'getCapabilities(): Promise<Result<AICapabilities>>',
    );
    const convBlock = apiPort.slice(apiPort.indexOf('export interface IAIConversationApiClient'));
    expect(convBlock).toContain('Promise<Result<AIConversationClientDTO>>');
    expect(convBlock).toContain('Promise<Result<ConversationListRes>>');
    expect(convBlock).toContain('Promise<Result<void>>');
  });

  it('AIClientPort capabilities + conversation methods return Promise<Result<...>>', () => {
    expect(clientPort).toContain('getCapabilities(): Promise<Result<AICapabilities>>');
    expect(clientPort).toContain(
      'listConversations(params?: {\n    page?: number;\n    pageSize?: number;\n  }): Promise<Result<ConversationListRes>>',
    );
    expect(clientPort).toContain('deleteConversation(id: string): Promise<Result<void>>');
  });

  it('HTTP/IPC adapters never unwrapResultOrThrow for capabilities or conversation', () => {
    for (const src of [capsHttp, capsIpc, convHttp, convIpc]) {
      expect(src).not.toContain('unwrapResultOrThrow');
      expect(src).toContain('Promise<Result<');
    }
  });
});
