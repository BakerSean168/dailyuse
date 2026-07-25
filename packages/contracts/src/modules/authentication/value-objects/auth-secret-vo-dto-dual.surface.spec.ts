import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

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
