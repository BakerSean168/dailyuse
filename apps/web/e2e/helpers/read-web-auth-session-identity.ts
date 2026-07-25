/**
 * Residual 1339: pure reader for Web auth session identity from localStorage JSON.
 * Used by real OAuth e2e so session proof is machine-checkable after semi-manual consent.
 */

export interface WebAuthSessionIdentity {
  hasOAuth?: boolean;
  status?: string;
  accountUuid?: string;
  email?: string | null;
}

export function readWebAuthSessionIdentity(
  authenticationJson: string | null | undefined,
): WebAuthSessionIdentity | null {
  if (!authenticationJson) return null;
  try {
    const parsed = JSON.parse(authenticationJson) as {
      currentIdentity?: WebAuthSessionIdentity | null;
    };
    return parsed.currentIdentity ?? null;
  } catch {
    return null;
  }
}

export function isOAuthAuthenticatedIdentity(
  identity: WebAuthSessionIdentity | null | undefined,
): boolean {
  return identity?.hasOAuth === true;
}
