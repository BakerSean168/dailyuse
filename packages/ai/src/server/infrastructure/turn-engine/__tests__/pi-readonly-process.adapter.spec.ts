import { describe, expect, it } from 'vitest';
import {
  PI_READONLY_PROCESS_ADAPTER_ID,
  PI_SPIKE_BINARY_ENV,
  PI_SPIKE_ENABLED_ENV,
  PI_SPIKE_PINNED_LABEL,
  PiReadonlyProcessAdapter,
} from '../pi-readonly-process.adapter';

describe('PiReadonlyProcessAdapter (residual 373 / 391)', () => {
  it('is never product default open-chat', () => {
    const adapter = new PiReadonlyProcessAdapter({ env: {} });
    expect(adapter.engineId).toBe(PI_READONLY_PROCESS_ADAPTER_ID);
    expect(adapter.productDefault).toBe(false);
    expect(adapter.readonlyMode).toBe(true);
    expect(adapter.placement).toBe('desktop');
  });

  it('probe fails closed when spike env is disabled', async () => {
    const adapter = new PiReadonlyProcessAdapter({
      env: {
        [PI_SPIKE_BINARY_ENV]: '/opt/pi/bin/pi',
      },
    });
    await expect(adapter.probe()).resolves.toEqual({
      status: 'unavailable',
      reason: 'PI_SPIKE_DISABLED',
    });
  });

  it('probe fails closed when binary is missing', async () => {
    const adapter = new PiReadonlyProcessAdapter({
      env: {
        [PI_SPIKE_ENABLED_ENV]: '1',
        [PI_SPIKE_BINARY_ENV]: '/tmp/missing-pi-binary',
      },
      isExecutable: () => false,
    });
    await expect(adapter.probe()).resolves.toEqual({
      status: 'unavailable',
      reason: 'PI_BINARY_UNAVAILABLE',
    });
  });

  it('probe reports available only when enabled and executable', async () => {
    const adapter = new PiReadonlyProcessAdapter({
      env: {
        [PI_SPIKE_ENABLED_ENV]: '1',
        [PI_SPIKE_BINARY_ENV]: '/opt/pi/bin/pi',
      },
      isExecutable: (path) => path === '/opt/pi/bin/pi',
    });
    await expect(adapter.probe()).resolves.toEqual({
      status: 'available',
      binaryPath: '/opt/pi/bin/pi',
      pinnedLabel: PI_SPIKE_PINNED_LABEL,
    });
  });

  it('buildDryRunSpawnPlan returns argv + scrubbed env + non-vault cwd with spawnAllowed false', () => {
    const adapter = new PiReadonlyProcessAdapter({
      env: {
        [PI_SPIKE_ENABLED_ENV]: '1',
        [PI_SPIKE_BINARY_ENV]: '/opt/pi/bin/pi',
        PATH: '/usr/bin',
        OPENAI_API_KEY: 'sk-secret',
        DAILYUSE_VAULT_PATH: '/Users/me/Vault',
        OBSIDIAN_VAULT_PATH: '/Users/me/Vault',
      },
      processCwd: () => '/safe/process/cwd',
    });

    const plan = adapter.buildDryRunSpawnPlan({
      runId: 'run-dry-1',
      identityId: 'id-1',
      message: 'analyze this note without writes',
      requestedVaultPath: '/Users/me/Vault',
    });

    expect(plan.spawnAllowed).toBe(false);
    expect(plan.blockedReason).toBe('PI_SPIKE_SPAWN_BLOCKED');
    expect(plan.productDefault).toBe(false);
    expect(plan.readonlyMode).toBe(true);
    expect(plan.vaultAsCwd).toBe(false);
    expect(plan.engineId).toBe(PI_READONLY_PROCESS_ADAPTER_ID);
    expect(plan.binaryPath).toBe('/opt/pi/bin/pi');
    expect(plan.cwd).toBe('/safe/process/cwd');
    expect(plan.cwd).not.toBe('/Users/me/Vault');
    expect(plan.forbiddenCwdCandidates).toEqual(
      expect.arrayContaining(['/Users/me/Vault']),
    );
    expect(plan.argv).toEqual([
      '/opt/pi/bin/pi',
      'analyze',
      '--readonly',
      '--no-write',
      '--no-spawn-tools',
      '--run-id',
      'run-dry-1',
      '--identity-id',
      'id-1',
      '--message',
      'analyze this note without writes',
    ]);
    expect(plan.env.PATH).toBe('/usr/bin');
    expect(plan.env[PI_SPIKE_ENABLED_ENV]).toBe('1');
    expect(plan.env[PI_SPIKE_BINARY_ENV]).toBe('/opt/pi/bin/pi');
    expect(plan.env).not.toHaveProperty('OPENAI_API_KEY');
    expect(plan.env).not.toHaveProperty('DAILYUSE_VAULT_PATH');
    expect(plan.env).not.toHaveProperty('OBSIDIAN_VAULT_PATH');
  });

  it('startTurn never spawns and stays fail-closed even when probe available', async () => {
    const adapter = new PiReadonlyProcessAdapter({
      env: {
        [PI_SPIKE_ENABLED_ENV]: '1',
        [PI_SPIKE_BINARY_ENV]: '/opt/pi/bin/pi',
      },
      isExecutable: () => true,
    });
    const result = await adapter.startTurn({
      runId: 'run-1',
      identityId: 'id-1',
      message: 'analyze this note',
    });
    expect(result.status).toBe('failed');
    expect(result.error).toMatch(/PI_SPIKE_SPAWN_BLOCKED/);
    expect(result.error).toMatch(/dry-run plan prepared/);
  });

  it('startTurn aborts when run was aborted', async () => {
    const adapter = new PiReadonlyProcessAdapter({
      env: {
        [PI_SPIKE_ENABLED_ENV]: '1',
        [PI_SPIKE_BINARY_ENV]: '/opt/pi/bin/pi',
      },
      isExecutable: () => true,
    });
    await adapter.abort('run-abort');
    await expect(
      adapter.startTurn({
        runId: 'run-abort',
        identityId: 'id-1',
        message: 'x',
      }),
    ).resolves.toEqual({ status: 'aborted' });
  });

  it('scrubs secrets and vault path from process env', () => {
    const adapter = new PiReadonlyProcessAdapter({ env: {} });
    const scrubbed = adapter.buildScrubbedEnv({
      PATH: '/usr/bin',
      HOME: '/home/user',
      OPENAI_API_KEY: 'sk-secret',
      GITHUB_TOKEN: 'ghp_secret',
      DAILYUSE_VAULT_PATH: '/Users/me/Vault',
      OBSIDIAN_VAULT_PATH: '/Users/me/Vault',
      MY_API_KEY: 'should-strip',
      SAFE_FLAG: '1',
    });
    expect(scrubbed).toEqual({
      PATH: '/usr/bin',
      HOME: '/home/user',
      SAFE_FLAG: '1',
    });
    expect(adapter.resolveProcessCwd('/Users/me/Vault')).not.toBe('/Users/me/Vault');
  });
});
