import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * AI provider-config Result-port surface (stage-6 residual 96):
 * Transport adapters and application ports return Promise<Result<T>> —
 * no throw-unwrap dual-track at the adapter boundary.
 */
describe('ai provider-config result port surface', () => {
  const apiPort = readFileSync(
    resolve(__dirname, '../../../application-client/ports/ai-api-client.port.ts'),
    'utf8',
  );
  const clientPort = readFileSync(
    resolve(__dirname, '../../../application-client/ai-client.port.ts'),
    'utf8',
  );
  const httpAdapter = readFileSync(
    resolve(__dirname, '../http/ai-provider-config-http.adapter.ts'),
    'utf8',
  );
  const ipcAdapter = readFileSync(
    resolve(__dirname, '../ipc/ai-provider-config-ipc.adapter.ts'),
    'utf8',
  );

  it('IAIProviderConfigApiClient methods return Promise<Result<...>>', () => {
    const block = apiPort.slice(apiPort.indexOf('export interface IAIProviderConfigApiClient'));
    expect(block).toContain('Promise<Result<AIProviderConfigClientDTO>>');
    expect(block).toContain('Promise<Result<AIProviderConfigClientDTO[]>>');
    expect(block).toContain('Promise<Result<void>>');
    expect(block).toContain('Promise<Result<TestAIProviderRes>>');
    expect(block).not.toMatch(/createProvider\(request: CreateAIProviderConfigReq\): Promise<AIProviderConfigClientDTO>;/);
  });

  it('AIClientPort provider methods return Promise<Result<...>>', () => {
    expect(clientPort).toContain(
      'createProvider(request: CreateAIProviderConfigReq): Promise<Result<AIProviderConfigClientDTO>>',
    );
    expect(clientPort).toContain('listProviders(): Promise<Result<AIProviderConfigClientDTO[]>>');
    expect(clientPort).toContain('deleteProvider(id: string): Promise<Result<void>>');
    expect(clientPort).toContain(
      'testProvider(request: TestAIProviderReq): Promise<Result<TestAIProviderRes>>',
    );
  });

  it('HTTP and IPC adapters never unwrapResultOrThrow', () => {
    expect(httpAdapter).not.toContain('unwrapResultOrThrow');
    expect(ipcAdapter).not.toContain('unwrapResultOrThrow');
    expect(httpAdapter).toContain('Promise<Result<');
    expect(ipcAdapter).toContain('Promise<Result<');
  });
});
