const STORAGE_KEY = '@dailyuse/mobile/auth-session';

export type PersistedAuthSession = {
  accessToken: string;
  refreshToken: string | null;
};

export async function readPersistedAuthSession(): Promise<PersistedAuthSession | null> {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<PersistedAuthSession>;
    if (typeof parsed.accessToken !== 'string' || parsed.accessToken.length === 0) {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken: typeof parsed.refreshToken === 'string' ? parsed.refreshToken : null,
    };
  } catch {
    return null;
  }
}

export async function writePersistedAuthSession(session: PersistedAuthSession): Promise<void> {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export async function clearPersistedAuthSession(): Promise<void> {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
}
