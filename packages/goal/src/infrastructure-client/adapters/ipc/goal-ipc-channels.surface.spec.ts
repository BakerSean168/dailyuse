import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GoalChannels } from '@memoflow/contracts/electron';

describe('GoalIpcAdapter vNext channel surface', () => {
  const source = readFileSync(resolve(__dirname, 'goal-ipc.adapter.ts'), 'utf8');

  it('uses contracts GoalChannels and includes explicit abandon', () => {
    expect(source).toContain("import { GoalChannels } from '@memoflow/contracts/electron'");
    expect(source).toContain('GoalChannels.CREATE');
    expect(source).toContain('GoalChannels.ABANDON');
    expect(source).not.toContain('GoalChannels.ARCHIVE_EXPIRED');
    expect(source).not.toContain('AIChannels');
  });

  it('keeps canonical status channel constants', () => {
    expect(GoalChannels.CREATE).toBe('goal:create');
    expect(GoalChannels.ABANDON).toBe('goal:abandon');
  });
});
