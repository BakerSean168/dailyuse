/**
 * Desktop entry redirect decision (after auth snapshot hydration).
 *
 * Only bounce authenticated users off the auth screen (or an unresolved
 * entry) to `/`. Business routes and the AI workspace must stay put —
 * the V2 shell restores the last business-tab route on mount
 * (UI_REDESIGN_V2_PLAN §4 session restore), and an unconditional
 * redirect-to-home would race with and clobber that restore.
 */
export function shouldRedirectAuthenticatedDesktopEntry(
  routeName: string | symbol | null | undefined,
): boolean {
  return routeName == null || routeName === 'auth';
}
