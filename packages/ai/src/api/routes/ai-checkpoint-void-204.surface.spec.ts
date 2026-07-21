import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * AI checkpoint void 204 envelope surface (stage-6 residual 108):
 * upsert/delete routes return ok(null) with successStatus 204 — no ok(undefined)
 * dual-track body on No Content responses.
 */
describe('ai checkpoint void 204 surface', () => {
  const agent = readFileSync(resolve(__dirname, './ai-agent-checkpoint.routes.ts'), 'utf8');
  const langgraph = readFileSync(resolve(__dirname, './ai-langgraph-checkpoint.routes.ts'), 'utf8');
  const expressAdapter = readFileSync(
    resolve(__dirname, '../../../../utils/src/result/express-adapter.ts'),
    'utf8',
  );

  it('agent checkpoint void routes use ok(null) + successStatus 204', () => {
    expect(agent).toContain('{ successStatus: 204 }');
    expect(agent).toContain('return ok(null)');
    expect(agent).not.toContain('return ok(undefined)');
  });

  it('langgraph checkpoint void routes use ok(null) + successStatus 204', () => {
    expect(langgraph).toContain('{ successStatus: 204 }');
    expect(langgraph).toContain('return ok(null)');
    expect(langgraph).not.toContain('return ok(undefined)');
  });

  it('express adapter sends empty body for HTTP 204', () => {
    expect(expressAdapter).toContain('successStatus === 204');
    expect(expressAdapter).toContain('res.end()');
  });
});
