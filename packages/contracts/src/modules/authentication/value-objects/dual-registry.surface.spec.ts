/**
 * Dual registry suite (elegance E3b tax cut).
 * Merged 2 dual-retired surface locks from this directory.
 * Behavior/assertions preserved; individual *-dual.surface.spec.ts removed.
 * Sources: auth-secret-vo-dto-dual.surface.spec.ts, device-info-dto-dual.surface.spec.ts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// --- merged from auth-secret-vo-dto-dual.surface.spec.ts ---
{
  /**
   * Residual 855: HashedPasswordDTO / EmailAddressDTO / PhoneNumberDTO / PlainPasswordDTO duals retired.
   * Sole VO interface + `export type XDTO = X` for each exact-match pair.
   */
  describe('auth secret/identifier vo dto duals retired (residual 855)', () => {
    const voDir = __dirname;
    const hashed = readFileSync(resolve(voDir, 'hashed-password.ts'), 'utf8');
    const email = readFileSync(resolve(voDir, 'email-address.ts'), 'utf8');
    const phone = readFileSync(resolve(voDir, 'phone-number.ts'), 'utf8');
    const plain = readFileSync(resolve(voDir, 'plain-password.ts'), 'utf8');
    const index = readFileSync(resolve(voDir, 'index.ts'), 'utf8');

    it('owns HashedPasswordDTO as type alias of HashedPassword', () => {
      expect(hashed).toContain('Residual 855');
      expect(hashed).toMatch(/export interface HashedPassword\b/);
      expect(hashed).toContain('export type HashedPasswordDTO = HashedPassword');
      expect(hashed).not.toMatch(/export interface HashedPasswordDTO\b/);
    });

    it('owns EmailAddressDTO and PhoneNumberDTO as type aliases', () => {
      expect(email).toContain('Residual 855');
      expect(email).toMatch(/export interface EmailAddress\b/);
      expect(email).toContain('export type EmailAddressDTO = EmailAddress');
      expect(email).not.toMatch(/export interface EmailAddressDTO\b/);
      expect(phone).toContain('Residual 855');
      expect(phone).toMatch(/export interface PhoneNumber\b/);
      expect(phone).toContain('export type PhoneNumberDTO = PhoneNumber');
      expect(phone).not.toMatch(/export interface PhoneNumberDTO\b/);
    });

    it('owns PlainPasswordDTO as type alias; barrel still exports all names', () => {
      expect(plain).toContain('Residual 855');
      expect(plain).toMatch(/export interface PlainPassword\b/);
      expect(plain).toContain('export type PlainPasswordDTO = PlainPassword');
      expect(plain).not.toMatch(/export interface PlainPasswordDTO\b/);
      for (const name of [
        'HashedPassword',
        'HashedPasswordDTO',
        'EmailAddress',
        'EmailAddressDTO',
        'PhoneNumber',
        'PhoneNumberDTO',
        'PlainPassword',
        'PlainPasswordDTO',
      ]) {
        expect(index).toContain(name);
      }
    });
  });
}

// --- merged from device-info-dto-dual.surface.spec.ts ---
{
  /**
   * Residual 847: DeviceInfoDTO dual body retired.
   * Sole DeviceInfo interface + `export type DeviceInfoDTO = DeviceInfo`.
   * Slim OpenAPI DeviceInfoSchema (deviceId+deviceType only) stays separate in api/response-schemas.
   * Residual 881 (soft): DeviceInfoClientDTO keep-boundary
   *   (protocol/device-info-client-keep-boundary.surface.spec.ts).
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
}
