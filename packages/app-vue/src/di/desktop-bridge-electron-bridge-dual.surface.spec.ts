import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 270: DesktopBridge dual collapsed to ElectronBridge from @dailyuse/ipc-client.
 */
describe('desktop bridge ElectronBridge single-track surface', () => {
  const keys = readFileSync(resolve(__dirname, 'keys.ts'), 'utf8');
  const index = readFileSync(resolve(__dirname, '../index.ts'), 'utf8');
  const controls = readFileSync(
    resolve(__dirname, '../shared/composables/useDesktopWindowControls.ts'),
    'utf8',
  );

  it('keys re-export ElectronBridge and do not define DesktopBridge dual', () => {
    expect(keys).toContain("from '@dailyuse/ipc-client'");
    expect(keys).toContain('export type { ElectronBridge }');
    expect(keys).toContain('InjectionKey<ElectronBridge>');
    expect(keys).not.toMatch(/export interface DesktopBridge\s*\{/);
    expect(keys).not.toMatch(/export type DesktopBridge\s*=/);
  });

  it('public app-vue surface exports ElectronBridge not DesktopBridge type', () => {
    expect(index).toContain('type ElectronBridge');
    expect(index).not.toMatch(/type DesktopBridge\b/);
  });

  it('window controls consume ElectronBridge', () => {
    expect(controls).toContain('ElectronBridge');
    expect(controls).not.toContain('DesktopBridge');
  });
});
