import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * AI provider list envelope surface (stage-6 residual 86):
 * HTTP controller, Desktop IPC, and client adapters share contracts
 * ListAIProviderConfigsRes `{ data: [...] }` — no bare-array dual-track.
 */
describe('ai provider list envelope surface', () => {
  const controller = readFileSync(
    resolve(__dirname, '../../../server/transport/ai-provider-config.controller.ts'),
    'utf8',
  );
  const electron = readFileSync(resolve(__dirname, '../../../electron/index.ts'), 'utf8');
  const httpAdapter = readFileSync(
    resolve(__dirname, '../http/ai-provider-config-http.adapter.ts'),
    'utf8',
  );
  const ipcAdapter = readFileSync(
    resolve(__dirname, '../ipc/ai-provider-config-ipc.adapter.ts'),
    'utf8',
  );

  it('HTTP controller wraps list as ListAIProviderConfigsRes', () => {
    expect(controller).toContain('ListAIProviderConfigsRes');
    expect(controller).toContain('return ok({ data: result.data })');
  });

  it('Desktop IPC PROVIDER_LIST returns the same { data } envelope', () => {
    expect(electron).toContain('AIChannels.PROVIDER_LIST');
    expect(electron).toContain('return ok({ data: result.data })');
  });

  it('client adapters unwrap ListAIProviderConfigsRes only (no bare-array dual path)', () => {
    expect(httpAdapter).toContain('ListAIProviderConfigsRes');
    expect(httpAdapter).toContain('unwrapResultOrThrow(result).data');
    expect(ipcAdapter).toContain('ListAIProviderConfigsRes');
    expect(ipcAdapter).toContain('unwrapResultOrThrow(result).data');
    expect(ipcAdapter).not.toContain('Array.isArray(data)');
    expect(ipcAdapter).not.toContain('AIProviderConfigClientDTO[] | { data');
  });
});
