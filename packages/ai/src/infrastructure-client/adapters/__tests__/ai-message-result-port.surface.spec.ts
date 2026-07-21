import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * AI message send/list Result-port surface (stage-6 residual 99):
 * sendMessage + getMessages return Promise<Result<T>>; streamMessage remains
 * throw-based (SSE/IPC stream control flow).
 */
describe('ai message send/list result port surface', () => {
  const apiPort = readFileSync(
    resolve(__dirname, '../../../application-client/ports/ai-api-client.port.ts'),
    'utf8',
  );
  const clientPort = readFileSync(
    resolve(__dirname, '../../../application-client/ai-client.port.ts'),
    'utf8',
  );
  const http = readFileSync(resolve(__dirname, '../http/ai-message-http.adapter.ts'), 'utf8');
  const ipc = readFileSync(resolve(__dirname, '../ipc/ai-message-ipc.adapter.ts'), 'utf8');

  it('sendMessage and getMessages/listMessages return Promise<Result<...>>', () => {
    expect(apiPort).toContain(
      'sendMessage(request: SendMessageReq): Promise<Result<SendMessageRes>>',
    );
    expect(apiPort).toContain('Promise<Result<MessageListRes>>');
    expect(clientPort).toContain(
      'sendMessage(request: SendMessageReq): Promise<Result<SendMessageRes>>',
    );
    expect(clientPort).toContain(
      'listMessages(conversationId: string, params?: { page?: number; pageSize?: number }): Promise<Result<MessageListRes>>',
    );
  });

  it('HTTP/IPC adapters return Result for send/list without unwrap dual-track', () => {
    expect(http).toContain('Promise<Result<SendMessageRes>>');
    expect(http).toContain('Promise<Result<MessageListRes>>');
    expect(http).not.toMatch(/async sendMessage[\s\S]*unwrapResultOrThrow/);
    expect(http).not.toMatch(/async getMessages[\s\S]*unwrapResultOrThrow/);
    expect(ipc).toContain('Promise<Result<SendMessageRes>>');
    expect(ipc).toContain('Promise<Result<MessageListRes>>');
    // stream no-bridge fallback may still unwrap sendMessage Result into throw path.
    expect(ipc).toContain('unwrapResultOrThrow(await this.sendMessage(request))');
  });

  it('streamMessage remains Promise<void> on ports', () => {
    expect(apiPort).toContain('): Promise<void>;');
    expect(clientPort).toContain('streamMessage(');
  });
});
