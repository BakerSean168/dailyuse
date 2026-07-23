import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { SessionRestoreResult } from './desktop-auth.types';

/**
 * Desktop auth protocol surface (stage-6 residual 70):
 * SessionRestoreResult uses ok only — no success dual-track field.
  * Soft residual 847: DeviceInfoDTO dual retired via DeviceInfo type alias (value-objects/device-info).
 */
describe('desktop-auth SessionRestoreResult surface', () => {
  const source = readFileSync(resolve(__dirname, 'desktop-auth.types.ts'), 'utf8');

  it('keeps SessionRestoreResult on ok without success dual-track', () => {
    expect(source).toMatch(/export interface SessionRestoreResult \{[\s\S]*?\bok:\s*boolean;/);
    expect(source).not.toMatch(/export interface SessionRestoreResult \{[\s\S]*?\bsuccess\?:/);
  });

  it('types SessionRestoreResult with required ok', () => {
    const sample: SessionRestoreResult = {
      ok: true,
      hasValidSession: false,
    };
    expect(sample.ok).toBe(true);
    expect(sample).not.toHaveProperty('success');
  });
});

/**
 * Residual 637: generic AuthOperationResult dual envelope is retired.
 * Desktop auth uses concrete typed *Result DTOs, not a catch-all { ok, error? }.
 */
describe('desktop-auth AuthOperationResult dual retired (residual 637)', () => {
  const source = readFileSync(resolve(__dirname, 'desktop-auth.types.ts'), 'utf8');
  const protocolIndex = readFileSync(resolve(__dirname, 'index.ts'), 'utf8');

  it('does not define or export AuthOperationResult dual envelope', () => {
    expect(source).toContain('Residual 637');
    expect(source).not.toMatch(/export interface AuthOperationResult/);
    expect(protocolIndex).not.toContain('AuthOperationResult');
  });

  it('keeps concrete typed auth result surfaces', () => {
    expect(source).toMatch(/export interface SessionRestoreResult/);
    expect(source).toMatch(/export interface TokenRefreshResult/);
    expect(source).toMatch(/export interface AutoLoginResult/);
    expect(source).toMatch(/export interface LoginResponse/);
  });
});

