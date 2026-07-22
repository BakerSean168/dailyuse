import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Residual 643: shared UI dual dead surfaces retired.
 * SimpleEditorTab (legacy note editor UI) + unused ContextMenuItem contracts
 * dual are removed; first-party note editor runtime stays retired (ADR-034).
 */
const here = dirname(fileURLToPath(import.meta.url));

describe('shared ui-components dual dead surfaces retired (residual 643)', () => {
  it('does not keep ui-components dual source file', () => {
    expect(existsSync(join(here, 'ui-components.ts'))).toBe(false);
  });

  it('shared barrel does not re-export ui-components duals', () => {
    const index = readFileSync(join(here, 'index.ts'), 'utf8');
    expect(index).not.toContain("from './ui-components'");
    expect(index).not.toContain('SimpleEditorTab');
    expect(index).not.toContain('ContextMenuItem');
  });
});
