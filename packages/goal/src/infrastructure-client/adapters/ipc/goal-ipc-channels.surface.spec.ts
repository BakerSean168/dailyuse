import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AIChannels, GoalChannels } from '@memoflow/contracts/electron';

/**
 * Goal IPC adapter channel surface (stage-6 residual 79):
 * Goal CRUD uses GoalChannels; AI key-result generation uses AIChannels.GOAL_GENERATE.
 * Must not import only AIChannels while calling GoalChannels (build break).
 */
describe('GoalIpcAdapter channel surface', () => {
  const source = readFileSync(resolve(__dirname, 'goal-ipc.adapter.ts'), 'utf8');

  it('imports both GoalChannels and AIChannels for their respective surfaces', () => {
    expect(source).toContain(
      "import { AIChannels, GoalChannels } from '@memoflow/contracts/electron'",
    );
    expect(source).toContain('GoalChannels.CREATE');
    expect(source).toContain('GoalChannels.LIST');
    expect(source).toContain('GoalChannels.ARCHIVE_EXPIRED');
    expect(source).toContain('AIChannels.GOAL_GENERATE');
    expect(source).not.toMatch(/import \{ AIChannels \} from '@memoflow\/contracts\/electron'/);
  });

  it('keeps contracts channel constants stable', () => {
    expect(GoalChannels.CREATE).toBe('goal:create');
    expect(GoalChannels.ARCHIVE_EXPIRED).toBe('goal:archiveExpired');
    expect(AIChannels.GOAL_GENERATE).toBe('ai:goal:generate');
  });
});
