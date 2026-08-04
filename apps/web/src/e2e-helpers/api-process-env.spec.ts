import { describe, expect, it } from 'vitest';
import { createApiProcessEnv } from '../../e2e/helpers/api-process-env';

describe('createApiProcessEnv', () => {
  it('enables local validation controls only for the E2E API process', () => {
    expect(createApiProcessEnv({}, 'e2e', '/tmp/api-logs')).toMatchObject({
      NODE_ENV: 'test',
      RUNTIME_LANE: 'e2e',
      LOCAL_VALIDATION: '1',
      LOG_DIR: '/tmp/api-logs',
    });
  });

  it('disables local validation controls for the real OAuth host-dev process', () => {
    expect(
      createApiProcessEnv(
        { NODE_ENV: 'test', LOCAL_VALIDATION: '1', LOG_DIR: '/custom/logs' },
        'host-dev',
        '/tmp/api-logs',
      ),
    ).toMatchObject({
      NODE_ENV: 'test',
      RUNTIME_LANE: 'host-dev',
      LOCAL_VALIDATION: '0',
      LOG_DIR: '/custom/logs',
    });
  });
});
