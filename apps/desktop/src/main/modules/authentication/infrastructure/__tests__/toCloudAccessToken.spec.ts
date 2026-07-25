import { describe, expect, it } from 'vitest';
import {
  GUEST_ACCESS_TOKEN,
  LOCAL_ACCESS_TOKEN,
  toCloudAccessToken,
} from '../session-types';

describe('toCloudAccessToken', () => {
  it('returns null for missing tokens', () => {
    expect(toCloudAccessToken(null)).toBeNull();
    expect(toCloudAccessToken(undefined)).toBeNull();
    expect(toCloudAccessToken('')).toBeNull();
  });

  it('blocks guest and offline placeholder tokens from authorizing cloud APIs', () => {
    expect(toCloudAccessToken(GUEST_ACCESS_TOKEN)).toBeNull();
    expect(toCloudAccessToken(LOCAL_ACCESS_TOKEN)).toBeNull();
  });

  it('passes through real online access tokens', () => {
    expect(toCloudAccessToken('eyJhbGciOiJIUzI1NiJ9.online.token')).toBe(
      'eyJhbGciOiJIUzI1NiJ9.online.token',
    );
  });
});
