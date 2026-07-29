import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AIChannels, AIStreamChannels } from '@memoflow/contracts/electron';

/**
 * AI electron seam surface (stage-6 residual):
 * Invoke handlers via contracts AIChannels only. Stream push events use
 * AIStreamChannels — not a dual-track local Ch map that redefines stream names.
 */
describe('AIElectronModule channel surface', () => {
  const source = readFileSync(resolve(__dirname, 'index.ts'), 'utf8');

  it('registers handlers via AIChannels and does not redefine a local Ch map', () => {
    expect(source).toContain('AIChannels');
    expect(source).toContain('AIStreamChannels');
    expect(source).toContain("from '@memoflow/contracts/electron'");
    expect(source).not.toMatch(/const Ch = \{/);
    expect(source).toContain('Object.values(AIChannels)');
    expect(source).toContain('AIChannels.MESSAGE_STREAM_START');
    expect(source).toContain('AIChannels.ASSISTANT_DISPATCH_START');
    expect(source).toContain('AIStreamChannels.ASSISTANT_DISPATCH_EVENT');
    expect(source).toContain('AIChannels.AGENT_RUN_START');
    expect(source).toContain('AIStreamChannels.MESSAGE_STREAM_CHUNK');
  });

  it('keeps stream event channels on AIStreamChannels only', () => {
    expect(AIChannels).not.toHaveProperty('MESSAGE_STREAM_CHUNK');
    expect(AIChannels).not.toHaveProperty('MESSAGE_STREAM_DONE');
    expect(AIChannels).not.toHaveProperty('MESSAGE_STREAM_ERROR');
    expect(AIStreamChannels.MESSAGE_STREAM_CHUNK).toBe('ai:chat:message:stream:chunk');
    expect(AIStreamChannels.MESSAGE_STREAM_DONE).toBe('ai:chat:message:stream:done');
    expect(AIStreamChannels.MESSAGE_STREAM_ERROR).toBe('ai:chat:message:stream:error');
    expect(source).not.toContain("'ai:chat:message:stream:chunk'");
    expect(source).not.toContain("'ai:chat:message:stream:done'");
    expect(source).not.toContain("'ai:chat:message:stream:error'");
  });
});
