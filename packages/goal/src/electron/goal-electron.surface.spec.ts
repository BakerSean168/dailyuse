import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GoalChannels } from '@memoflow/contracts/electron';

/**
 * Goal electron seam surface (stage-6 residual):
 * Channel registration must use contracts GoalChannels only — no dual-track local Ch map.
 */
describe('GoalElectronModule channel surface', () => {
  const source = readFileSync(resolve(__dirname, 'index.ts'), 'utf8');

  it('registers handlers via GoalChannels and does not redefine a local Ch map', () => {
    expect(source).toContain('GoalChannels');
    expect(source).toContain("from '@memoflow/contracts/electron'");
    expect(source).not.toMatch(/const Ch = \{/);
    expect(source).toContain('Object.values(GoalChannels)');
    expect(source).toContain('GoalChannels.LIST');
    expect(source).toContain('GoalChannels.ARCHIVE_EXPIRED');
    expect(source).toContain('GoalChannels.FOLDER_LIST');
  });

  it('keeps live archiveExpired channel on contracts surface', () => {
    expect(GoalChannels.ARCHIVE_EXPIRED).toBe('goal:archiveExpired');
  });
});
