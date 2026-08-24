export interface WebAuthCapabilities {
  github: boolean;
}

const UNAVAILABLE_CAPABILITIES: WebAuthCapabilities = Object.freeze({ github: false });

/**
 * Read the public authentication capabilities exposed by the current API host.
 *
 * The UI fails closed: when the capability endpoint is unavailable or returns
 * an unexpected payload, optional login providers stay hidden instead of
 * presenting an action that is guaranteed to fail at runtime.
 */
export async function loadWebAuthCapabilities(): Promise<WebAuthCapabilities> {
  try {
    const response = await fetch('/api/auth/capabilities', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (!response.ok) return UNAVAILABLE_CAPABILITIES;

    const payload = (await response.json()) as {
      providers?: { github?: unknown };
    };
    return {
      github: payload.providers?.github === true,
    };
  } catch {
    return UNAVAILABLE_CAPABILITIES;
  }
}
