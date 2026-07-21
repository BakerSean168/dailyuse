import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Agent getEvents ownership surface (stage-6 residual 103/104):
 * getEvents must verify run ownership via getRun + ensureAgentRunOwnedByIdentity
 * before calling the underlying event port (no event leakage dual-track).
 */
describe('ai agent getEvents ownership surface', () => {
  const runtime = readFileSync(resolve(__dirname, '../ai-runtime.ts'), 'utf8');

  it('getEvents gates on getRun ownership before port.getEvents', () => {
    const getEventsStart = runtime.indexOf('async getEvents(');
    expect(getEventsStart).toBeGreaterThan(-1);
    const block = runtime.slice(getEventsStart, getEventsStart + 900);
    expect(block).toContain('port.getRun(');
    expect(block).toContain('ensureAgentRunOwnedByIdentity(snapshot, cx.identityId)');
    expect(block).toContain('if (!ownership.ok)');
    expect(block).toContain('port.getEvents(');
    // Ownership check appears before getEvents call in the block.
    expect(block.indexOf('ensureAgentRunOwnedByIdentity')).toBeLessThan(block.indexOf('port.getEvents('));
  });
});
