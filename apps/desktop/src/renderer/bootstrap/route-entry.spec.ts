import { describe, expect, it } from 'vitest';

import { shouldRedirectAuthenticatedDesktopEntry } from './route-entry';

describe('shouldRedirectAuthenticatedDesktopEntry', () => {
  it('skips the authenticated redirect for the custom notification window', () => {
    expect(shouldRedirectAuthenticatedDesktopEntry('custom-notification')).toBe(false);
  });

  it('keeps the authenticated redirect for normal app routes', () => {
    expect(shouldRedirectAuthenticatedDesktopEntry('home')).toBe(true);
    expect(shouldRedirectAuthenticatedDesktopEntry(undefined)).toBe(true);
  });
});
