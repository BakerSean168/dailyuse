import { describe, expect, it } from 'vitest';
import { GoalChannels } from './ipc-channels';

/**
 * Goal IPC surface (stage-6 residual):
 * archiveExpired is a live GoalIpcAdapter channel and must stay on contracts.
 */
describe('GoalChannels surface', () => {
  it('exposes live archiveExpired and focus/folder channels', () => {
    expect(GoalChannels.ARCHIVE_EXPIRED).toBe('goal:archiveExpired');
    expect(GoalChannels.FOCUS_MODE_GET).toBe('goal:focus-mode:get');
    expect(GoalChannels.FOLDER_LIST).toBe('goal:folder:list');
  });
});
