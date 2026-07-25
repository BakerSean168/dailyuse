import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TaskChannels } from '@dailyuse/contracts/electron';

/**
 * Task electron seam surface (stage-6 residual):
 * Register via contracts TaskChannels only; no local Ch map and no unsupported
 * task:instance:update dual-track handler.
 */
describe('TaskElectronModule channel surface', () => {
  const source = readFileSync(resolve(__dirname, 'index.ts'), 'utf8');

  it('registers handlers via TaskChannels and does not redefine a local Ch map', () => {
    expect(source).toContain('TaskChannels');
    expect(source).toContain("from '@dailyuse/contracts/electron'");
    expect(source).not.toMatch(/const Ch = \{/);
    expect(source).toContain('Object.values(TaskChannels)');
    expect(source).toContain('TaskChannels.TEMPLATE_LIST');
    expect(source).toContain('TaskChannels.INSTANCE_LIST');
    expect(source).toContain('TaskChannels.DEPENDENCY_CREATE');
  });

  it('does not expose retired unsupported task:instance:update channel', () => {
    expect(source).not.toContain('task:instance:update');
    expect(source).not.toContain('INSTANCE_UPDATE');
    expect(TaskChannels).not.toHaveProperty('INSTANCE_UPDATE');
    expect(Object.values(TaskChannels)).not.toContain('task:instance:update');
  });
});
