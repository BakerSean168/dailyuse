import { describe, expect, it, vi } from 'vitest';
import { AccountApplicationTimezoneAdapter } from '../account-timezone-adapter';

describe('AccountApplicationTimezoneAdapter', () => {
  it('returns timezone when accountApi returns profile successfully', async () => {
    const accountApi = {
      getProfile: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          id: 'user-1',
          settings: {
            timezone: 'Asia/Tokyo',
          },
        },
      }),
    };
    const adapter = new AccountApplicationTimezoneAdapter(accountApi);
    const tz = await adapter.getUserTimezone('user-1');

    expect(accountApi.getProfile).toHaveBeenCalledWith({ identityId: 'user-1' });
    expect(tz).toBe('Asia/Tokyo');
  });

  it('returns null when accountApi returns empty or error', async () => {
    const accountApi = {
      getProfile: vi.fn().mockResolvedValue({ ok: false, data: null }),
    };
    const adapter = new AccountApplicationTimezoneAdapter(accountApi);
    const tz = await adapter.getUserTimezone('user-1');

    expect(tz).toBeNull();
  });

  it('returns null when accountApi is not provided', async () => {
    const adapter = new AccountApplicationTimezoneAdapter(null);
    const tz = await adapter.getUserTimezone('user-1');

    expect(tz).toBeNull();
  });
});
