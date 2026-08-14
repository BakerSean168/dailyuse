import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 250: AI transport has no identity createAITransportHandlers dual path.
 * Controllers wire to AIApplicationPort (aiModule.api) directly.
 */
describe('AI transport handlers single-track surface', () => {
  const dir = __dirname;
  const index = readFileSync(resolve(dir, 'index.ts'), 'utf8');
  const factory = resolve(dir, 'ai.transport-handlers.ts');
  const apiModule = readFileSync(resolve(dir, '../../api/module.ts'), 'utf8');

  it('drops identity createAITransportHandlers factory', () => {
    expect(existsSync(factory)).toBe(false);
    expect(index).not.toContain('createAITransportHandlers');
    expect(index).not.toContain('ai.transport-handlers');
  });

  it('API module wires controllers from options.instance.api only', () => {
    expect(apiModule).toContain('const handlers = options.instance.api');
    expect(apiModule).not.toContain('createAITransportHandlers');
  });

  it('wires AssistantFacade transport via handlers.dispatchAssistant (residual 345)', () => {
    expect(index).toContain('AIAssistantFacadeController');
    expect(apiModule).toContain('AIAssistantFacadeController');
    expect(apiModule).toContain('dispatchAssistant: handlers.dispatchAssistant');
    expect(apiModule).toContain("router.use('/ai/assistant'");
    expect(apiModule).not.toContain('executeApproved');
  });
});
