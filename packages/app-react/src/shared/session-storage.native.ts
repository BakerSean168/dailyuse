import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@memoflow/mobile/auth-session';

export type PersistedAuthSession = {
  accessToken: string;
  refreshToken: string | null;
};

export async function readPersistedAuthSession(): Promise<PersistedAuthSession | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
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
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export async function clearPersistedAuthSession(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
