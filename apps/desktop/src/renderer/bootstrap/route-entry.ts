export function shouldRedirectAuthenticatedDesktopEntry(
  routeName: string | symbol | null | undefined,
): boolean {
  return routeName !== 'custom-notification';
}
