import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 349: Vue AssistantFacade entry uses dispatchAssistant only;
 * never puts identityId in client command body; does not executeApproved.
 */
describe('useAssistantDispatch surface', () => {
  const dir = __dirname;
  const composable = readFileSync(resolve(dir, 'useAssistantDispatch.ts'), 'utf8');
  const types = readFileSync(resolve(dir, 'types.ts'), 'utf8');
  const index = readFileSync(resolve(dir, 'index.ts'), 'utf8');

  it('exports composable and extends AIChatService with dispatchAssistant', () => {
    expect(index).toContain("export { useAssistantDispatch } from './useAssistantDispatch'");
    expect(types).toContain("'dispatchAssistant'");
    expect(composable).toContain('service.dispatchAssistant');
    expect(composable).toContain('AssistantClientCommand');
    expect(composable).toContain('identityId must not be included');
    expect(composable).not.toContain('executeApproved');
    expect(composable).not.toMatch(/\.streamMessage\s*\(/);
  });
});
