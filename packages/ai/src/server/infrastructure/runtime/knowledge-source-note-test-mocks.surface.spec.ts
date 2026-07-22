import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 229: AI runtime test mocks use note port methods only.
 * No fetchAllResources dual-track stub names after knowledge source rename.
 */
describe('AI knowledge source note test mock surface', () => {
  const dir = __dirname;
  const capabilities = readFileSync(
    resolve(dir, '__tests__/ai-runtime-capabilities.spec.ts'),
    'utf8',
  );
  const remote = readFileSync(
    resolve(dir, '__tests__/remote-ai-service.runtime.spec.ts'),
    'utf8',
  );

  it('runtime tests mock note methods instead of fetchAllResources', () => {
    for (const src of [capabilities, remote]) {
      expect(src).toContain('listRelevantNotes');
      expect(src).not.toContain('fetchAllResources');
      expect(src).not.toContain('listRelevantResources');
    }
  });
});
