import { describe, expect, it } from 'vitest';
import { AutoUpdateChannels } from './ipc-channels';

/**
 * Auto-update IPC surface (stage-6 residual):
 * Desktop auto-update handlers own a contracts channel map as single source of truth.
 */
describe('AutoUpdateChannels surface', () => {
  it('keeps live auto-update channels stable', () => {
    expect(AutoUpdateChannels.CHECK).toBe('auto-update:check');
    expect(AutoUpdateChannels.DOWNLOAD).toBe('auto-update:download');
    expect(AutoUpdateChannels.INSTALL).toBe('auto-update:install');
    expect(AutoUpdateChannels.STATUS).toBe('auto-update:status');
    expect(AutoUpdateChannels.CONFIG).toBe('auto-update:config');
  });

  it('exposes exactly the five live auto-update channels', () => {
    expect(Object.keys(AutoUpdateChannels).sort()).toEqual(
      ['CHECK', 'CONFIG', 'DOWNLOAD', 'INSTALL', 'STATUS'].sort(),
    );
  });
});
