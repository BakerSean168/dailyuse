import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * AI provider list envelope surface (stage-6 residual 86/96):
 * HTTP controller, Desktop IPC, and client adapters share contracts
 * ListAIProviderConfigsRes `{ data: [...] }` — no bare-array dual-track.
 * Residual 96: adapters map Result envelopes (no unwrapResultOrThrow dual-track).
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
  const listSchema = readFileSync(
    resolve(
      __dirname,
      '../../../../../contracts/src/modules/ai/api/response-schemas.ts',
    ),
    'utf8',
  );
  const listDto = readFileSync(
    resolve(
      __dirname,
      '../../../../../contracts/src/modules/ai/api/ai-provider-config.dto.ts',
    ),
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

  it('client adapters map ListAIProviderConfigsRes only (no bare-array or throw dual path)', () => {
    expect(httpAdapter).toContain('ListAIProviderConfigsRes');
    expect(httpAdapter).toContain('map(result, (envelope) => envelope.data)');
    expect(httpAdapter).not.toContain('unwrapResultOrThrow');
    expect(ipcAdapter).toContain('ListAIProviderConfigsRes');
    expect(ipcAdapter).toContain('map(result, (envelope) => envelope.data)');
    expect(ipcAdapter).not.toContain('unwrapResultOrThrow');
    expect(ipcAdapter).not.toContain('Array.isArray(data)');
    expect(ipcAdapter).not.toContain('AIProviderConfigClientDTO[] | { data');
  });

  it('list contracts use full ClientDTO items (no Summary dual-track)', () => {
    const schemaBlock = listSchema.slice(listSchema.indexOf('ListAIProviderConfigsResSchema'));
    expect(schemaBlock).toContain('data: z.array(AIProviderConfigClientDTOSchema)');
    expect(schemaBlock.split('export const')[0]).not.toContain('AIProviderConfigSummarySchema');
    // Residual 695/1331: list Res is z.infer of schema (no interface body dual).
    expect(listDto).toContain(
      'export type ListAIProviderConfigsRes = z.infer<typeof ListAIProviderConfigsResSchema>',
    );
    expect(listDto).not.toMatch(/export interface ListAIProviderConfigsRes\b/);
    expect(listDto).not.toContain('AIProviderConfigSummary');
  });
});
