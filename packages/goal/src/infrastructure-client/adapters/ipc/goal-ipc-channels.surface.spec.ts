import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GoalChannels } from '@memoflow/contracts/electron';

/**
 * Goal IPC adapter channel surface after AI-vNext:
 * Goal owns GoalChannels only. AI-assisted goal creation runs through the canonical
 * Mastra workflow transport and must not leak back into the Goal domain adapter.
 */
describe('GoalIpcAdapter channel surface', () => {
  const source = readFileSync(resolve(__dirname, 'goal-ipc.adapter.ts'), 'utf8');

  it('uses GoalChannels only and keeps legacy AI goal generation out of the domain adapter', () => {
    expect(source).toContain("import { GoalChannels } from '@memoflow/contracts/electron'");
    expect(source).toContain('GoalChannels.CREATE');
    expect(source).toContain('GoalChannels.LIST');
    expect(source).toContain('GoalChannels.ARCHIVE_EXPIRED');
    expect(source).not.toContain('AIChannels');
    expect(source).not.toContain('ai:goal:generate');
  });

  it('keeps contracts channel constants stable', () => {
    expect(GoalChannels.CREATE).toBe('goal:create');
    expect(GoalChannels.ARCHIVE_EXPIRED).toBe('goal:archiveExpired');
  });
});
