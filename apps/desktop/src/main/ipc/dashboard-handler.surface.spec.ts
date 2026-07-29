import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DashboardChannels } from '@memoflow/contracts/electron';

/**
 * Dashboard IPC surface (stage-6 residual):
 * Handler registers via contracts DashboardChannels — no string dual-track channel name.
 */
describe('dashboard-handler channel surface', () => {
  const source = readFileSync(resolve(__dirname, 'dashboard-handler.ts'), 'utf8');

  it('registers via DashboardChannels.GET_STATS', () => {
    expect(source).toContain('DashboardChannels');
    expect(source).toContain("from '@memoflow/contracts/electron'");
    expect(source).toContain('DashboardChannels.GET_STATS');
    expect(source).not.toContain("'dashboard:get-stats'");
    expect(DashboardChannels.GET_STATS).toBe('dashboard:get-stats');
  });
});
