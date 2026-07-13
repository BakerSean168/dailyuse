import { describe, expect, it } from 'vitest';

import { shouldRedirectAuthenticatedDesktopEntry } from './route-entry';

describe('shouldRedirectAuthenticatedDesktopEntry', () => {
  it('skips the authenticated redirect for the custom notification window', () => {
    expect(shouldRedirectAuthenticatedDesktopEntry('custom-notification')).toBe(false);
  });

  it('redirects authenticated users away from the auth screen or an unresolved entry', () => {
    expect(shouldRedirectAuthenticatedDesktopEntry('auth')).toBe(true);
    expect(shouldRedirectAuthenticatedDesktopEntry(undefined)).toBe(true);
    expect(shouldRedirectAuthenticatedDesktopEntry(null)).toBe(true);
  });

  it('keeps shell routes in place so tab session restore is not clobbered', () => {
    expect(shouldRedirectAuthenticatedDesktopEntry('ai-workspace')).toBe(false);
    expect(shouldRedirectAuthenticatedDesktopEntry('goal-list')).toBe(false);
  });
});
