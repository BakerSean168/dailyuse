import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Goal IPC adapters surface (stage-6 residual):
 * Invokes contracts GoalChannels only — no string-template dual-track channel names.
 */
describe('Goal IPC adapters channel surface', () => {
  const files = [
    'goal-ipc.adapter.ts',
    'goal-folder-ipc.adapter.ts',
    'goal-focus-ipc.adapter.ts',
  ] as const;

  it.each(files)('%s uses GoalChannels and no this.channel templates', (fileName) => {
    const source = readFileSync(resolve(__dirname, fileName), 'utf8');
    expect(source).toContain("from '@memoflow/contracts/electron'");
    expect(source).toContain('GoalChannels.');
    expect(source).not.toContain('private readonly channel');
    expect(source).not.toMatch(/\$\{this\.channel\}/);
  });
});
