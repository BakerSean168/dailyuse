import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Goal IPC adapter channel surface', () => {
  it('uses GoalChannels without local channel templates or retired adapters', () => {
    const source = readFileSync(resolve(__dirname, 'goal-ipc.adapter.ts'), 'utf8');
    expect(source).toContain("from '@memoflow/contracts/electron'");
    expect(source).toContain('GoalChannels.');
    expect(source).not.toContain('private readonly channel');
    expect(source).not.toMatch(/\$\{this\.channel\}/);
    expect(source).not.toContain('FOLDER_');
    expect(source).not.toContain('FOCUS_MODE_');
  });
});
