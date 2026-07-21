import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AuthPlatformEntry from './AuthPlatformEntry.vue';

describe('AuthPlatformEntry', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('full-page replaces the current /auth URL so AuthApp owns the surface', async () => {
    const replace = vi.fn();
    vi.stubGlobal('location', {
      pathname: '/auth',
      search: '?redirect=%2Frepository',
      hash: '',
      replace,
    });

    const wrapper = mount(AuthPlatformEntry);
    await flushPromises();

    expect(wrapper.find('[data-testid="auth-platform-entry"]').exists()).toBe(true);
    expect(replace).toHaveBeenCalledWith('/auth?redirect=%2Frepository');

    wrapper.unmount();
  });
});
