import { describe, expect, it } from 'vitest';
import { isTestEmailCodeEndpointEnabled } from './is-test-email-code-endpoint-enabled';

describe('isTestEmailCodeEndpointEnabled', () => {
  it('enables under NODE_ENV=test', () => {
    expect(isTestEmailCodeEndpointEnabled({ NODE_ENV: 'test' })).toBe(true);
  });

  it('enables under RUNTIME_LANE=e2e', () => {
    expect(
      isTestEmailCodeEndpointEnabled({ NODE_ENV: 'production', RUNTIME_LANE: 'e2e' }),
    ).toBe(true);
  });

  it('enables under LOCAL_VALIDATION=1 for local Docker', () => {
    expect(
      isTestEmailCodeEndpointEnabled({
        NODE_ENV: 'production',
        LOCAL_VALIDATION: '1',
      }),
    ).toBe(true);
    expect(
      isTestEmailCodeEndpointEnabled({
        NODE_ENV: 'production',
        LOCAL_VALIDATION: 'true',
      }),
    ).toBe(true);
  });

  it('disables under plain production without local/e2e flags', () => {
    expect(
      isTestEmailCodeEndpointEnabled({
        NODE_ENV: 'production',
        RUNTIME_LANE: 'host-dev',
      }),
    ).toBe(false);
    expect(isTestEmailCodeEndpointEnabled({ NODE_ENV: 'production' })).toBe(false);
    expect(isTestEmailCodeEndpointEnabled({})).toBe(false);
  });

  it('does not treat LOCAL_VALIDATION=0 as enabled', () => {
    expect(
      isTestEmailCodeEndpointEnabled({
        NODE_ENV: 'production',
        LOCAL_VALIDATION: '0',
      }),
    ).toBe(false);
  });
});
