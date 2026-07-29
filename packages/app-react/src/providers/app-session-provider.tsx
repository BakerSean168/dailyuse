import { createContext, startTransition, type PropsWithChildren, useContext, useEffect, useRef, useState } from 'react';

import {
  createAuthenticationHttpClient,
  type AuthenticationClientPort,
} from '@memoflow/authentication/client';
import type {
  AuthIdentityClientDTO,
  AuthResponseDTO,
  AuthSessionClientDTO,
  CurrentUserDTO,
  ForgotPasswordReq,
  LoginByEmailReq,
  RegisterByEmailReq,
} from '@memoflow/contracts/authentication';
import { createResultHttpClient, type IResultHttpClient } from '@memoflow/http-client';

import { MOBILE_API_BASE_URL } from '../constants/auth';
import {
  clearPersistedAuthSession,
  readPersistedAuthSession,
  writePersistedAuthSession,
} from '../shared/session-storage';

export type AppSessionKind = 'signed-out' | 'authenticating' | 'authenticated' | 'guest' | 'demo';

export type AppSessionUser = {
  id: string;
  displayName: string;
  workspaceName: string;
};

export type AppSessionValue = {
  apiBaseUrl: string;
  currentIdentity: AuthIdentityClientDTO | null;
  currentSession: AuthSessionClientDTO | null;
  currentUser: AppSessionUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  isGuest: boolean;
  isRemoteAuthenticated: boolean;
  lastError: string | null;
  sessionKind: AppSessionKind;
  clearError: () => void;
  createAuthorizedHttpClient: () => IResultHttpClient;
  enterGuestMode: () => void;
  forgotPassword: (req: ForgotPasswordReq) => Promise<boolean>;
  loginByEmail: (req: LoginByEmailReq) => Promise<boolean>;
  registerByEmail: (req: RegisterByEmailReq) => Promise<boolean>;
  signInDemo: () => void;
  signOut: () => Promise<void>;
};

const AppSessionContext = createContext<AppSessionValue | null>(null);

const GUEST_USER: AppSessionUser = {
  id: 'guest-local',
  displayName: 'Guest session',
  workspaceName: 'Local sandbox',
};

const DEMO_USER: AppSessionUser = {
  id: 'demo-owner',
  displayName: 'MemoFlow Demo',
  workspaceName: 'MemoFlow preview',
};

function getIdentityLabel(identity: AuthIdentityClientDTO): string {
  const preferredIdentifier =
    identity.identifiers.find((item) => item.type === 'Email') ?? identity.identifiers[0];

  if (!preferredIdentifier) {
    return 'Authenticated user';
  }

  return preferredIdentifier.type === 'Email' ? preferredIdentifier.value : preferredIdentifier.value.value;
}

/**
 * CurrentUser/OpenAPI response identity is intentionally slim ({id,status}).
 * Promote it to the client DTO shape used by session UI with fail-closed defaults.
 */
function toClientIdentity(
  identity: AuthIdentityClientDTO | CurrentUserDTO['identity'],
): AuthIdentityClientDTO {
  if ('identifiers' in identity && Array.isArray(identity.identifiers)) {
    return identity;
  }

  const now = Date.now();
  return {
    id: identity.id,
    status: identity.status,
    failedLoginAttempts: 0,
    lastFailedAttempt: null,
    lockedUntil: null,
    identifiers: [],
    credentials: [],
    hasPassword: false,
    hasEmail: false,
    hasPhone: false,
    hasOAuth: false,
    version: 0,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

function toClientSession(
  session: AuthSessionClientDTO | CurrentUserDTO['session'] | null | undefined,
): AuthSessionClientDTO | null {
  if (!session) {
    return null;
  }

  if (
    'deviceInfo' in session &&
    session.deviceInfo &&
    'deviceFingerprint' in session.deviceInfo
  ) {
    return session as AuthSessionClientDTO;
  }

  const deviceInfo = session.deviceInfo as { deviceId?: string; deviceType?: string };
  const now = Date.now();
  const deviceId = deviceInfo.deviceId ?? 'unknown-device';
  return {
    id: session.id,
    identityId: session.identityId,
    deviceInfo: {
      deviceId,
      deviceFingerprint: deviceId,
      deviceType:
        (deviceInfo.deviceType as AuthSessionClientDTO['deviceInfo']['deviceType']) ?? 'Unknown',
      deviceName: null,
      os: null,
      osVersion: null,
      browser: null,
      appVersion: null,
      ipAddress: null,
      userAgent: null,
      location: null,
      firstSeenAt: now,
      lastSeenAt: now,
    },
    isCurrentSession: session.isCurrentSession,
    version: session.version,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    expiresAt: session.expiresAt,
    lastActiveAt: session.lastActiveAt,
    deletedAt: session.deletedAt,
  };
}

function createWorkspaceName(kind: AppSessionKind): string {
  if (kind === 'authenticated') {
    return 'Remote workspace';
  }

  if (kind === 'guest') {
    return GUEST_USER.workspaceName;
  }

  return DEMO_USER.workspaceName;
}

export function AppSessionProvider({ children }: PropsWithChildren) {
  const [sessionKind, setSessionKind] = useState<AppSessionKind>('signed-out');
  const [currentIdentity, setCurrentIdentity] = useState<AuthIdentityClientDTO | null>(null);
  const [currentSession, setCurrentSession] = useState<AuthSessionClientDTO | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const tokenRef = useRef<{ accessToken: string | null; refreshToken: string | null }>({
    accessToken: null,
    refreshToken: null,
  });

  const authServiceRef = useRef<AuthenticationClientPort | null>(null);

  function resetRemoteState() {
    tokenRef.current = { accessToken: null, refreshToken: null };
    startTransition(() => {
      setCurrentIdentity(null);
      setCurrentSession(null);
    });
  }

  function persistCurrentTokens() {
    const accessToken = tokenRef.current.accessToken;
    if (!accessToken) {
      void clearPersistedAuthSession();
      return;
    }

    void writePersistedAuthSession({
      accessToken,
      refreshToken: tokenRef.current.refreshToken,
    });
  }

  function applyAuthenticatedState(args: {
    identity: AuthIdentityClientDTO | CurrentUserDTO['identity'];
    session?: AuthSessionClientDTO | CurrentUserDTO['session'] | null;
    tokens?: { accessToken: string; refreshToken?: string | null };
  }) {
    if (args.tokens) {
      tokenRef.current = {
        accessToken: args.tokens.accessToken,
        refreshToken: args.tokens.refreshToken ?? tokenRef.current.refreshToken,
      };
      persistCurrentTokens();
    }

    startTransition(() => {
      setCurrentIdentity(toClientIdentity(args.identity));
      setCurrentSession(toClientSession(args.session));
      setSessionKind('authenticated');
      setLastError(null);
    });
  }

  function handleUnauthorizedSession() {
    resetRemoteState();
    void clearPersistedAuthSession();
    setLastError('Session expired. Sign in again to continue.');
    setSessionKind('signed-out');
  }

  async function refreshRemoteAccessToken(): Promise<string | null> {
    const refreshToken = tokenRef.current.refreshToken;
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch(`${MOBILE_API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        resetRemoteState();
        void clearPersistedAuthSession();
        setSessionKind('signed-out');
        return null;
      }

      const json = (await response.json()) as {
        ok?: boolean;
        data?: AuthResponseDTO;
      };
      // First-party auth refresh must return HttpResponse data envelope (no raw dual-track).
      if (!json || typeof json !== 'object' || !('data' in json) || !json.data) {
        resetRemoteState();
        void clearPersistedAuthSession();
        setSessionKind('signed-out');
        return null;
      }
      const data = json.data;
      applyAuthenticatedState({
        identity: data.identity,
        session: data.session,
        tokens: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        },
      });
      return data.accessToken;
    } catch {
      resetRemoteState();
      void clearPersistedAuthSession();
      setSessionKind('signed-out');
      return null;
    }
  }

  function createAuthorizedHttpClient(): IResultHttpClient {
    return createResultHttpClient({
      baseURL: MOBILE_API_BASE_URL,
      timeout: 15000,
      tokenProvider: {
        getAccessToken: () => tokenRef.current.accessToken,
        getRefreshToken: () => tokenRef.current.refreshToken,
      },
      onTokenRefresh: refreshRemoteAccessToken,
      onUnauthorized: handleUnauthorizedSession,
    });
  }

  if (!authServiceRef.current) {
    authServiceRef.current = createAuthenticationHttpClient(createAuthorizedHttpClient());
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrapSession() {
      const persistedSession = await readPersistedAuthSession();
      if (!persistedSession?.accessToken) {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
        return;
      }

      tokenRef.current = persistedSession;
      const result = await authServiceRef.current!.getCurrentUser();

      if (cancelled) {
        return;
      }

      if (!result.ok) {
        resetRemoteState();
        await clearPersistedAuthSession();
        setIsBootstrapping(false);
        return;
      }

      applyAuthenticatedState({
        identity: result.data.identity,
        session: result.data.session ?? null,
      });
      setIsBootstrapping(false);
    }

    void bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loginByEmail(req: LoginByEmailReq): Promise<boolean> {
    setLastError(null);
    setSessionKind('authenticating');

    const result = await authServiceRef.current!.loginByEmail(req);
    if (!result.ok) {
      resetRemoteState();
      await clearPersistedAuthSession();
      setSessionKind('signed-out');
      setLastError(result.error.message);
      return false;
    }

    applyAuthenticatedState({
      identity: result.data.identity,
      session: result.data.session,
      tokens: {
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
      },
    });
    return true;
  }

  async function registerByEmail(req: RegisterByEmailReq): Promise<boolean> {
    setLastError(null);
    setSessionKind('authenticating');

    const result = await authServiceRef.current!.registerByEmail(req);
    if (!result.ok) {
      resetRemoteState();
      await clearPersistedAuthSession();
      setSessionKind('signed-out');
      setLastError(result.error.message);
      return false;
    }

    applyAuthenticatedState({
      identity: result.data.identity,
      session: result.data.session,
      tokens: {
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
      },
    });
    return true;
  }

  async function forgotPassword(req: ForgotPasswordReq): Promise<boolean> {
    setLastError(null);
    setSessionKind('authenticating');

    const result = await authServiceRef.current!.forgotPassword(req);
    if (!result.ok) {
      setSessionKind('signed-out');
      setLastError(result.error.message);
      return false;
    }

    setSessionKind('signed-out');
    return true;
  }

  function enterGuestMode() {
    resetRemoteState();
    void clearPersistedAuthSession();
    setLastError(null);
    setSessionKind('guest');
  }

  function signInDemo() {
    resetRemoteState();
    void clearPersistedAuthSession();
    setLastError(null);
    setSessionKind('demo');
  }

  async function signOut() {
    if (sessionKind === 'authenticated') {
      await authServiceRef.current!.logout();
    }

    resetRemoteState();
    await clearPersistedAuthSession();
    setLastError(null);
    setSessionKind('signed-out');
  }

  function clearError() {
    setLastError(null);
  }

  const currentUser =
    sessionKind === 'authenticated' && currentIdentity
      ? {
          id: String(currentIdentity.id),
          displayName: getIdentityLabel(currentIdentity),
          workspaceName: createWorkspaceName(sessionKind),
        }
      : sessionKind === 'guest'
        ? GUEST_USER
        : sessionKind === 'demo'
          ? DEMO_USER
          : null;

  return (
    <AppSessionContext.Provider
      value={{
        apiBaseUrl: MOBILE_API_BASE_URL,
        currentIdentity,
        currentSession,
        currentUser,
        isAuthenticated: sessionKind !== 'signed-out' && sessionKind !== 'authenticating',
        isBootstrapping,
        isGuest: sessionKind === 'guest',
        isRemoteAuthenticated: sessionKind === 'authenticated',
        lastError,
        sessionKind,
        clearError,
        createAuthorizedHttpClient,
        enterGuestMode,
        forgotPassword,
        loginByEmail,
        registerByEmail,
        signInDemo,
        signOut,
      }}>
      {children}
    </AppSessionContext.Provider>
  );
}

export function useAppSession() {
  const context = useContext(AppSessionContext);

  if (!context) {
    throw new Error('useAppSession must be used inside AppSessionProvider.');
  }

  return context;
}
