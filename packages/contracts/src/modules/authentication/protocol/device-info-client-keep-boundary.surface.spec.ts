import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 881: DeviceInfoClientDTO ≠ full DeviceInfo VO keep-boundary.
 * Desktop renderer slim device dual stays separate from full VO and slim OpenAPI schema.
 * Does not flip §13.2 checkboxes.
 */
describe('device-info client keep-boundary (residual 881)', () => {
  const protocolDir = __dirname;
  const voDir = resolve(protocolDir, '../value-objects');
  const apiDir = resolve(protocolDir, '../api');

  const desktopAuth = readFileSync(resolve(protocolDir, 'desktop-auth.types.ts'), 'utf8');
  const deviceInfo = readFileSync(resolve(voDir, 'device-info.ts'), 'utf8');
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');

  function clientDtoBody(source: string): string {
    const start = source.indexOf('export interface DeviceInfoClientDTO');
    expect(start).toBeGreaterThanOrEqual(0);
    const brace = source.indexOf('{', start);
    const end = source.indexOf('\n}', brace);
    return source.slice(brace, end + 2);
  }

  it('keeps DeviceInfoClientDTO as separate slim interface (not DeviceInfo type alias)', () => {
    expect(desktopAuth).toContain('Residual 881');
    expect(desktopAuth).toMatch(/export interface DeviceInfoClientDTO\b/);
    expect(desktopAuth).not.toContain('export type DeviceInfoClientDTO = DeviceInfo');
    expect(desktopAuth).not.toContain('export type DeviceInfoClientDTO = DeviceInfoDTO');
    const body = clientDtoBody(desktopAuth);
    // Slim optional fields (not full VO required fingerprint/browser/location)
    expect(body).toContain('deviceFingerprint?: string');
    expect(body).toContain('deviceType: string');
    expect(body).not.toMatch(/browser\??\s*:/);
    expect(body).not.toMatch(/location\??\s*:/);
    expect(body).not.toMatch(/ipAddress\??\s*:/);
    expect(body).not.toMatch(/userAgent\??\s*:/);
  });

  it('keeps full DeviceInfo VO sole body with required rich fields', () => {
    expect(deviceInfo).toContain('Residual 847');
    expect(deviceInfo).toContain('Residual 881');
    expect(deviceInfo).toMatch(/export interface DeviceInfo\b/);
    expect(deviceInfo).toContain('export type DeviceInfoDTO = DeviceInfo');
    expect(deviceInfo).toContain('deviceFingerprint: string');
    expect(deviceInfo).toContain('browser: string | null');
    expect(deviceInfo).toContain('ipAddress: string | null');
    expect(deviceInfo).toContain('userAgent: string | null');
    expect(deviceInfo).toContain('location:');
  });

  it('keeps slim OpenAPI DeviceInfoSchema separate from both client dual and full VO', () => {
    expect(responseSchemas).toContain('const DeviceInfoSchema = z.object({');
    const slim = responseSchemas.split('const DeviceInfoSchema = z.object({')[1].split('});')[0];
    expect(slim).toContain('deviceId: z.string()');
    expect(slim).toContain('deviceType: z.string()');
    expect(slim).not.toContain('deviceFingerprint');
    expect(slim).not.toContain('firstSeenAt');
    expect(slim).not.toContain('location');
    // protocol still exports DeviceInfoClientDTO name for desktop continuity
    expect(desktopAuth).toContain('DeviceInfoClientDTO');
  });
});
