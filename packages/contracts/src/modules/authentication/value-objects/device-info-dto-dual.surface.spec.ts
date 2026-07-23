import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 847: DeviceInfoDTO dual body retired.
 * Sole DeviceInfo interface + `export type DeviceInfoDTO = DeviceInfo`.
 * Slim OpenAPI DeviceInfoSchema (deviceId+deviceType only) stays separate in api/response-schemas.
 */
describe('device info dto dual retired (residual 847)', () => {
  const voDir = __dirname;
  const source = readFileSync(resolve(voDir, 'device-info.ts'), 'utf8');
  const index = readFileSync(resolve(voDir, 'index.ts'), 'utf8');
  const responseSchemas = readFileSync(
    resolve(voDir, '../api/response-schemas.ts'),
    'utf8',
  );

  it('owns DeviceInfo as sole interface; DeviceInfoDTO is type alias', () => {
    expect(source).toContain('Residual 847');
    expect(source).toMatch(/export interface DeviceInfo\b/);
    expect(source).toContain('export type DeviceInfoDTO = DeviceInfo');
    expect(source).not.toMatch(/export interface DeviceInfoDTO\b/);
  });

  it('barrel still exports DeviceInfo and DeviceInfoDTO', () => {
    expect(index).toContain('DeviceInfo');
    expect(index).toContain('DeviceInfoDTO');
  });

  it('keeps slim OpenAPI DeviceInfoSchema separate (not full VO dual)', () => {
    expect(responseSchemas).toContain('const DeviceInfoSchema = z.object({');
    expect(responseSchemas).toContain('deviceId: z.string()');
    expect(responseSchemas).toContain('deviceType: z.string()');
    // slim schema must not claim full VO fields (fingerprint/location dual)
    const slim = responseSchemas.split('const DeviceInfoSchema = z.object({')[1].split('});')[0];
    expect(slim).not.toContain('deviceFingerprint');
    expect(slim).not.toContain('firstSeenAt');
  });
});
