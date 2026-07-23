import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getRequestId } from './get-request-id';

/**
 * Residual 965: getRequestId dual retired.
 * Sole body in get-request-id.ts; agent-checkpoint / agent-runtime /
 * langgraph-checkpoint routes import it.
 * Soft residual 963: findSSEBoundary dual retired (find-sse-boundary-dual.surface.spec.ts).
 * Soft residual 972: tip focused suite numbers track Residual 972 evidence tip (277/1219).
 * Soft residual 967: isAbortLikeError dual retired (is-abort-like-error-dual.surface.spec.ts).
 * Does not flip §13.2 checkboxes.
 */
describe('getRequestId dual retired (residual 965)', () => {
  const sharedDir = __dirname;
  const sole = readFileSync(resolve(sharedDir, 'get-request-id.ts'), 'utf8');
  const routes = {
    agentCheckpoint: readFileSync(
      resolve(sharedDir, '../api/routes/ai-agent-checkpoint.routes.ts'),
      'utf8',
    ),
    agentRuntime: readFileSync(
      resolve(sharedDir, '../api/routes/ai-agent-runtime.routes.ts'),
      'utf8',
    ),
    langgraphCheckpoint: readFileSync(
      resolve(sharedDir, '../api/routes/ai-langgraph-checkpoint.routes.ts'),
      'utf8',
    ),
  } as const;

  it('owns sole getRequestId helper body', () => {
    expect(sole).toContain('Residual 965');
    expect(sole).toMatch(/export function getRequestId\b/);
    expect(sole).toContain('req.traceId ?? req.id');
  });

  it('agent/langgraph route modules import sole without local dual bodies', () => {
    for (const [label, source] of Object.entries(routes)) {
      expect(source, label).toContain('Residual 965');
      expect(source, label).toContain(
        "import { getRequestId } from '../../shared/get-request-id'",
      );
      expect(source, label).not.toMatch(/function getRequestId\b/);
      expect(source, label).toContain('getRequestId(req)');
    }
  });

  it('prefers traceId then falls back to id', () => {
    expect(getRequestId({ traceId: 't-1', id: 'i-1' })).toBe('t-1');
    expect(getRequestId({ id: 'i-2' })).toBe('i-2');
    expect(getRequestId({ traceId: 't-3' })).toBe('t-3');
    expect(getRequestId({})).toBeUndefined();
  });
});
