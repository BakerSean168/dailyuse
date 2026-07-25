import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1087: dead useAIDraftPersistence composable removed.
 * packages/app-vue/src/modules/ai/composables/useAIDraftPersistence.ts had no runtime
 * consumers (only barrel re-export). Chat draft UX for knowledge QA/note is UI-local;
 * AI workflow draft helpers remain in goalDraftHelpers / useAIWorkflowPersistence.
 * Soft residual 1071: dead useViewportBreakpoint composable removed.
 * Soft residual 1063: dead result-helpers dual removed.
 * Does not flip §13.2 checkboxes.
 */
describe('useAIDraftPersistence dead composable removed (residual 1087)', () => {
  const dir = __dirname;
  const deadPath = resolve(dir, 'useAIDraftPersistence.ts');
  const index = readFileSync(resolve(dir, 'index.ts'), 'utf8');

  it('removes useAIDraftPersistence.ts dead composable file', () => {
    expect(existsSync(deadPath)).toBe(false);
  });

  it('AI composables barrel does not re-export the dead helper', () => {
    expect(index).not.toContain('useAIDraftPersistence');
    expect(index).not.toContain('useAIDraftPersistence.ts');
    expect(index).toContain("export { useAIChatSession } from './useAIChatSession'");
    expect(index).toContain("export { useAIWorkflowPersistence } from './useAIWorkflowPersistence'");
  });

  it('sibling workflow persistence does not reintroduce chat-draft localStorage dual', () => {
    const workflow = readFileSync(resolve(dir, 'useAIWorkflowPersistence.ts'), 'utf8');
    expect(workflow).not.toContain('useAIDraftPersistence');
    expect(workflow).not.toContain('ai:chat-draft');
    expect(workflow).not.toMatch(/function useAIDraftPersistence\b/);
  });

  it('documents residual 1087 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'use-ai-draft-persistence-dead.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1087');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dead');
  });
});
