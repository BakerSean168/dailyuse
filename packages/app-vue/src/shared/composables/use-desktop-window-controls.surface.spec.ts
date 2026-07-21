import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Desktop window controls consumer surface (stage-6 residual):
 * Unwraps contracts Result envelopes from window control IPC responses.
 */
describe('useDesktopWindowControls result surface', () => {
  const source = readFileSync(resolve(__dirname, 'useDesktopWindowControls.ts'), 'utf8');

  it('unwraps Result envelopes instead of casting raw IPC payloads', () => {
    expect(source).toContain("import { isOk, type Result } from '@dailyuse/contracts/result'");
    expect(source).toContain('function readResultData');
    expect(source).toContain('isOk(result)');
    expect(source).not.toMatch(/as\s*\|\s*Partial<WindowControlsState>/);
  });
});
