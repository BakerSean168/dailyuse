import { describe, expect, it } from 'vitest';
import { detectHostEnvShadowing } from './env-shadow.mjs';

describe('detectHostEnvShadowing', () => {
  it('warns when host process env differs from env-file for critical keys', () => {
    const envFileMap = new Map([
      ['DB_PASSWORD', 'file-password'],
      ['JWT_SECRET', 'file-jwt'],
      ['NODE_ENV', 'production'],
    ]);
    const warnings = detectHostEnvShadowing(
      {
        DB_PASSWORD: 'host-password',
        JWT_SECRET: 'file-jwt',
        NODE_ENV: 'development',
      },
      envFileMap,
    );
    expect(warnings.some((w) => w.includes('DB_PASSWORD'))).toBe(true);
    expect(warnings.some((w) => w.includes('NODE_ENV'))).toBe(true);
    expect(warnings.some((w) => w.includes('JWT_SECRET'))).toBe(false);
  });

  it('is silent when host matches file or host key is unset', () => {
    const envFileMap = new Map([['DB_PASSWORD', 'same']]);
    expect(detectHostEnvShadowing({ DB_PASSWORD: 'same' }, envFileMap)).toEqual([]);
    expect(detectHostEnvShadowing({}, envFileMap)).toEqual([]);
  });
});
