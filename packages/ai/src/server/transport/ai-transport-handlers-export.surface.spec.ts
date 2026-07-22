import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 246: AI transport mapping returns AIApplicationPort only.
 * No AITransportHandlers dual type alias.
 */
describe('AI transport handlers single-track surface', () => {
  const dir = __dirname;
  const handlers = readFileSync(resolve(dir, 'ai.transport-handlers.ts'), 'utf8');
  const index = readFileSync(resolve(dir, 'index.ts'), 'utf8');

  it('maps to AIApplicationPort without dual AITransportHandlers type', () => {
    expect(handlers).toContain('export function createAITransportHandlers');
    expect(handlers).toContain('): AIApplicationPort');
    expect(handlers).not.toContain('export type AITransportHandlers');
    expect(handlers).not.toMatch(/AITransportHandlers\s*=\s*AIApplicationPort/);
    expect(index).toContain('createAITransportHandlers');
    expect(index).not.toContain('export type { AITransportHandlers }');
    expect(index).not.toMatch(/type \{[^}]*AITransportHandlers/);
  });
});
