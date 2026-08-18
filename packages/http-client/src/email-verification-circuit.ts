/**
 * Session-scoped fuse for EMAIL_VERIFICATION_REQUIRED responses.
 *
 * Sensitive APIs return 403 with domainCode EMAIL_VERIFICATION_REQUIRED for
 * unverified accounts. Without a fuse, UI loaders re-fire the same request
 * on every mount/watch and create a retry storm. This module:
 *
 * 1. Tracks per-resource attempt counts within the browser session
 * 2. Short-circuits further transport calls after the allowed budget
 * 3. Exposes a degraded message key for UI surfaces
 *
 * Budget default is 2 hits per resource (first real probe + one retry),
 * matching the PM-journey acceptance criterion.
 */

export const EMAIL_VERIFICATION_DOMAIN_CODE = 'EMAIL_VERIFICATION_REQUIRED';

export const EMAIL_VERIFICATION_MESSAGE_KEY = 'errors.EMAIL_VERIFICATION_REQUIRED';

/** Default max transport hits per resource per session before short-circuit. */
export const DEFAULT_EMAIL_VERIFICATION_HIT_BUDGET = 2;

export type EmailVerificationCircuitState = {
  /** Resources that already exhausted their budget (or hit the domain code). */
  blockedResources: Set<string>;
  /** Successful transport attempts that observed EMAIL_VERIFICATION_REQUIRED. */
  hitCounts: Map<string, number>;
  /** Session-level flag: at least one resource tripped the fuse. */
  tripped: boolean;
};

function createState(): EmailVerificationCircuitState {
  return {
    blockedResources: new Set(),
    hitCounts: new Map(),
    tripped: false,
  };
}

let state: EmailVerificationCircuitState = createState();

/**
 * Normalize a request URL into a stable resource key (path without query).
 */
export function resourceKeyFromUrl(url: string | undefined | null): string {
  if (!url) return '*';
  try {
    // Absolute or relative
    const parsed = url.includes('://') ? new URL(url) : new URL(url, 'http://local.invalid');
    return parsed.pathname || '*';
  } catch {
    const bare = url.split('?')[0]?.split('#')[0];
    return bare && bare.length > 0 ? bare : '*';
  }
}

export function isEmailVerificationRequiredError(
  error:
    | {
        code?: string;
        domainCode?: string;
        message?: string;
        messageKey?: string;
        context?: { domainCode?: string; messageKey?: string; [key: string]: unknown };
      }
    | null
    | undefined,
): boolean {
  if (!error) return false;
  const code =
    error.domainCode ??
    error.context?.domainCode ??
    (typeof error.code === 'string' && error.code === EMAIL_VERIFICATION_DOMAIN_CODE
      ? error.code
      : undefined);
  if (code === EMAIL_VERIFICATION_DOMAIN_CODE) return true;
  if (
    error.messageKey === EMAIL_VERIFICATION_MESSAGE_KEY ||
    error.context?.messageKey === EMAIL_VERIFICATION_MESSAGE_KEY
  ) {
    return true;
  }
  return false;
}

/**
 * Whether a further transport call for this resource is allowed.
 * Returns false when the resource is already blocked (budget exhausted).
 */
export function canAttemptEmailVerificationSensitiveRequest(resource: string): boolean {
  const key = resourceKeyFromUrl(resource);
  if (state.blockedResources.has(key) || state.blockedResources.has('*')) {
    return false;
  }
  const hits = state.hitCounts.get(key) ?? 0;
  return hits < DEFAULT_EMAIL_VERIFICATION_HIT_BUDGET;
}

/**
 * Record that a transport call observed EMAIL_VERIFICATION_REQUIRED.
 * Returns the new hit count for the resource.
 */
export function recordEmailVerificationRequired(
  resource: string,
  budget: number = DEFAULT_EMAIL_VERIFICATION_HIT_BUDGET,
): number {
  const key = resourceKeyFromUrl(resource);
  const next = (state.hitCounts.get(key) ?? 0) + 1;
  state.hitCounts.set(key, next);
  state.tripped = true;
  if (next >= budget) {
    state.blockedResources.add(key);
  }
  return next;
}

/**
 * Build a Result-shaped failure payload for short-circuited calls.
 * Callers map this into their Result.fail without hitting the network.
 */
export function buildEmailVerificationBlockedError(resource?: string): {
  code: string;
  domainCode: string;
  message: string;
  messageKey: string;
  resource: string;
  shortCircuited: true;
} {
  const key = resourceKeyFromUrl(resource);
  return {
    code: 'FORBIDDEN',
    domainCode: EMAIL_VERIFICATION_DOMAIN_CODE,
    message: 'Email verification required',
    messageKey: EMAIL_VERIFICATION_MESSAGE_KEY,
    resource: key,
    shortCircuited: true,
  };
}

export function isEmailVerificationCircuitTripped(): boolean {
  return state.tripped;
}

export function getEmailVerificationHitCount(resource: string): number {
  return state.hitCounts.get(resourceKeyFromUrl(resource)) ?? 0;
}

/** Test / logout helper — clears the in-memory session fuse. */
export function resetEmailVerificationCircuit(): void {
  state = createState();
}

/** Snapshot for diagnostics / tests. */
export function getEmailVerificationCircuitSnapshot(): {
  tripped: boolean;
  blockedResources: string[];
  hitCounts: Record<string, number>;
} {
  return {
    tripped: state.tripped,
    blockedResources: [...state.blockedResources].sort(),
    hitCounts: Object.fromEntries(state.hitCounts),
  };
}
