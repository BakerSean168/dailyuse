import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DevChannels } from '@dailyuse/contracts/electron';

/**
 * Dev memory monitor IPC surface (stage-6 residual):
 * Registers via contracts DevChannels and returns Result ok envelopes
 * (no raw dual-track response payloads).
 */
describe('memory-monitor channel surface', () => {
  const source = readFileSync(resolve(__dirname, 'memory-monitor.ts'), 'utf8');

  it('registers via DevChannels only', () => {
    expect(source).toContain('DevChannels.MEMORY_STATUS');
    expect(source).toContain('DevChannels.MEMORY_SNAPSHOTS');
    expect(source).toContain('DevChannels.MEMORY_FORCE_GC');
    expect(source).not.toMatch(/ipcMain\.handle\(\s*'dev:memory/);
    expect(DevChannels.MEMORY_STATUS).toBe('dev:memory:status');
  });

  it('returns contracts Result ok envelopes instead of raw dual-track payloads', () => {
    expect(source).toContain("import { ok } from '@dailyuse/contracts/result'");
    expect(source).toContain('return ok(monitor.getCurrentStatus())');
    expect(source).toContain('return ok(monitor.getSnapshots())');
    expect(source).toContain('return ok(monitor.forceGC())');
    expect(source).not.toMatch(/return\s+monitor\.getCurrentStatus\(\)/);
    expect(source).not.toMatch(/success:\s*true/);
    expect(source).not.toMatch(/success:\s*false/);
  });
});
