import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { withObservabilityPayload } from './with-observability-payload';
import type { AIExecutionLogInput } from '../../application/ports';

/**
 * Residual 971: withObservabilityPayload dual retired.
 * Sole body in with-observability-payload.ts; PowerSync + Prisma execution-log adapters import it.
 * Soft residual 969: knowledge-index value helpers dual retired
 *   (knowledge-index-value-helpers-dual.surface.spec.ts).
 * Soft residual 970: tip focused suite numbers track Residual 970 evidence tip (276/1216).
 * Does not flip §13.2 checkboxes.
 */
describe('withObservabilityPayload dual retired (residual 971)', () => {
  const adaptersDir = __dirname;
  const sole = readFileSync(resolve(adaptersDir, 'with-observability-payload.ts'), 'utf8');
  const powersync = readFileSync(
    resolve(adaptersDir, 'powersync/ai-execution-log-powersync.adapter.ts'),
    'utf8',
  );
  const prisma = readFileSync(
    resolve(adaptersDir, 'prisma/ai-execution-log-prisma.adapter.ts'),
    'utf8',
  );

  it('owns sole withObservabilityPayload helper body', () => {
    expect(sole).toContain('Residual 971');
    expect(sole).toMatch(/export function withObservabilityPayload\b/);
    expect(sole).toContain('__observability');
    expect(sole).toContain('AIExecutionLogInput');
    expect(sole).toContain('errorCategory');
  });

  it('PowerSync + Prisma execution-log adapters import sole without local dual bodies', () => {
    for (const [label, source] of [
      ['powersync', powersync],
      ['prisma', prisma],
    ] as const) {
      expect(source, label).toContain('Residual 971');
      expect(source, label).toContain(
        "import { withObservabilityPayload } from '../with-observability-payload'",
      );
      expect(source, label).not.toMatch(/function withObservabilityPayload\b/);
      expect(source, label).toContain('withObservabilityPayload(');
    }
  });

  it('merges defined observability fields onto payload', () => {
    const base = { kind: 'chat' };
    const emptyInput = {
      identityId: 'id-1',
      conversationId: null,
      messageId: null,
      model: 'm',
      providerId: 'p',
      providerName: 'pn',
      requestId: undefined,
      errorCategory: undefined,
      costEstimate: undefined,
      usage: null,
      latencyMs: 0,
      status: 'ok',
      errorMessage: null,
      payload: {},
    } as unknown as AIExecutionLogInput;
    // Still has defined model/provider fields → observability present
    expect(withObservabilityPayload(base, emptyInput).__observability).toEqual({
      providerId: 'p',
      providerName: 'pn',
      model: 'm',
    });

    const sparse = {
      ...emptyInput,
      model: undefined,
      providerId: undefined,
      providerName: undefined,
      requestId: 'req-1',
    } as unknown as AIExecutionLogInput;
    expect(withObservabilityPayload(base, sparse)).toEqual({
      kind: 'chat',
      __observability: {
        requestId: 'req-1',
      },
    });

    const none = {
      ...emptyInput,
      model: undefined,
      providerId: undefined,
      providerName: undefined,
    } as unknown as AIExecutionLogInput;
    expect(withObservabilityPayload(base, none)).toEqual(base);
  });
});
