import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 351: open chat default send path goes through AssistantFacade
 * (dispatchAssistant), not streamMessage dual path.
 */
describe('useAIChatSession open chat Host dispatch surface', () => {
  const session = readFileSync(resolve(__dirname, 'useAIChatSession.ts'), 'utf8');
  const types = readFileSync(resolve(__dirname, 'types.ts'), 'utf8');

  it('routes handleSendChat via dispatchAssistant with model selection', () => {
    expect(session).toContain('loadService.dispatchAssistant');
    expect(session).toContain("type: 'message'");
    expect(session).toContain('providerId: selectedModel.providerId');
    expect(session).toContain('model: selectedModel.modelId');
    expect(session).toContain("event.type === 'message.delta'");
    expect(session).toContain("event.type === 'message.completed'");
    expect(session).not.toMatch(/loadService\.streamMessage\s*\(/);
    expect(types).toContain("'dispatchAssistant'");
    expect(types).not.toMatch(/'\s*streamMessage\s*'/);
  });
});
