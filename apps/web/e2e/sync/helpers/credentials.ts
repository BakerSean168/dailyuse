import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { APIRequestContext } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..', '..', '..', '..', '..');
// Sync E2E uses a checked-in local credential contract so Web/API/Desktop can
// share the same account without hardcoding test secrets in each helper.
const credentialsPath = path.join(workspaceRoot, '.e2e-test-credentials.json');

interface RawCredentialsFile {
  api_config?: {
    base_url?: string;
    api_prefix?: string;
    full_api_url?: string;
  };
  web_config?: {
    base_url?: string;
  };
  credentials?: {
    username?: string;
    email?: string;
    password?: string;
  };
}

interface ResultEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
}

export interface SyncCredentials {
  username: string;
  email: string;
  password: string;
  apiBaseUrl: string;
  webBaseUrl: string;
}

function readRequiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required e2e credential field: ${field}`);
  }

  return value.trim();
}

function parseCredentialsFile(): RawCredentialsFile {
  return JSON.parse(readFileSync(credentialsPath, 'utf8')) as RawCredentialsFile;
}

function buildApiBaseUrl(raw: RawCredentialsFile): string {
  // Prefer env overrides so CI and local proxy-based debugging can redirect the
  // suite without rewriting the credential file.
  const envFullApiUrl =
    process.env.DAILYUSE_API_URL?.trim() || process.env.E2E_API_FULL_URL?.trim();
  if (envFullApiUrl) {
    return envFullApiUrl.replace(/\/+$/, '').match(/\/api\/v\d+$/i)
      ? envFullApiUrl.replace(/\/+$/, '')
      : `${envFullApiUrl.replace(/\/+$/, '')}/api/v1`;
  }

  const envApiOrigin =
    process.env.E2E_API_BASE_URL?.trim() || process.env.PROXY_TARGET_URL?.trim();
  if (envApiOrigin) {
    const apiPrefix = (raw.api_config?.api_prefix?.trim() || '/api/v1').replace(/^\/?/, '/');
    return `${envApiOrigin.replace(/\/+$/, '')}${apiPrefix}`;
  }

  const explicitFullUrl = raw.api_config?.full_api_url?.trim();
  if (explicitFullUrl) {
    return explicitFullUrl.replace(/\/+$/, '');
  }

  const baseUrl = readRequiredString(raw.api_config?.base_url, 'api_config.base_url').replace(
    /\/+$/,
    '',
  );
  const apiPrefix = readRequiredString(raw.api_config?.api_prefix, 'api_config.api_prefix').replace(
    /^\/?/,
    '/',
  );

  return `${baseUrl}${apiPrefix}`;
}

async function postAuthEnvelope<T>(
  request: APIRequestContext,
  url: string,
  data: Record<string, unknown>,
): Promise<ResultEnvelope<T>> {
  const response = await request.post(url, { data });
  const rawBody = await response.text();
  const body = JSON.parse(rawBody) as ResultEnvelope<T>;

  if (!body || typeof body !== 'object' || typeof body.ok !== 'boolean') {
    throw new Error(`Unexpected auth response from ${url}: ${rawBody}`);
  }

  return body;
}

export function loadSyncCredentials(): SyncCredentials {
  const raw = parseCredentialsFile();

  return {
    username: readRequiredString(raw.credentials?.username, 'credentials.username'),
    email: readRequiredString(raw.credentials?.email, 'credentials.email'),
    password: readRequiredString(raw.credentials?.password, 'credentials.password'),
    apiBaseUrl: buildApiBaseUrl(raw),
    webBaseUrl: (
      process.env.E2E_WEB_BASE_URL?.trim() ||
      raw.web_config?.base_url?.trim() ||
      'http://127.0.0.1:5173'
    ).replace(/\/+$/, ''),
  };
}

/**
 * Residual 1337: register leaves identity Unverified; web login then lands on
 * verify-email scene. Complete the test-lane code path so sync can enter shell.
 */
async function waitForCapturedEmailCode(
  request: APIRequestContext,
  credentials: SyncCredentials,
  kind: 'email-verify' | 'password-reset' = 'email-verify',
  timeoutMs = 30_000,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  const url = new URL(`${credentials.apiBaseUrl}/auth/test/last-email-code`);
  url.searchParams.set('email', credentials.email);
  url.searchParams.set('kind', kind);

  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      const response = await request.get(url.toString());
      if (response.ok()) {
        const body = (await response.json()) as {
          data?: { code?: string | null };
          code?: string | null;
        };
        const code = body.data?.code ?? body.code ?? null;
        if (typeof code === 'string' && /^\d{6}$/.test(code)) {
          return code;
        }
      } else {
        lastError = new Error(`HTTP ${response.status()}`);
      }
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(
    `Timed out waiting for ${kind} code for ${credentials.email}: ${
      lastError instanceof Error ? lastError.message : String(lastError ?? 'no code')
    }`,
  );
}

async function sendAndVerifyEmail(
  request: APIRequestContext,
  credentials: SyncCredentials,
): Promise<void> {
  // Residual 1337: Unverified accounts can login at API level but web UI stays on
  // verify-email. Always send a fresh test-lane code then verify via API.
  const sendUrl = `${credentials.apiBaseUrl}/auth/email/send-code`;
  const sendAttempt = await postAuthEnvelope<unknown>(request, sendUrl, {
    email: credentials.email,
    purpose: 'EmailVerify',
  });
  if (!sendAttempt.ok) {
    // Already Active / rate-limit / missing identity — leave to caller.
    throw new Error(
      `Send email code failed for ${credentials.email}: ${
        sendAttempt.error?.message ?? 'unknown send error'
      }`,
    );
  }

  // Anti-enumeration: already-Active emails return ok without issuing a code.
  // Short poll avoids a 30s hang when no challenge was created.
  let code: string;
  try {
    code = await waitForCapturedEmailCode(request, credentials, 'email-verify', 4_000);
  } catch {
    return;
  }
  const verifyUrl = `${credentials.apiBaseUrl}/auth/email/verify`;
  const verifyAttempt = await postAuthEnvelope<unknown>(request, verifyUrl, {
    email: credentials.email,
    code,
    purpose: 'EmailVerify',
  });
  if (!verifyAttempt.ok) {
    throw new Error(
      `Email verify failed for ${credentials.email}: ${
        verifyAttempt.error?.message ?? 'unknown verify error'
      }`,
    );
  }
}

export async function ensureE2EAccount(
  request: APIRequestContext,
  credentials: SyncCredentials,
): Promise<void> {
  // The suite tolerates either an existing seeded account or first-run account
  // creation. This keeps local sync regression setup lightweight.
  // Residual 1337: force Active email so web login leaves /auth (not verify scene).
  const loginUrl = `${credentials.apiBaseUrl}/auth/login`;
  const registerUrl = `${credentials.apiBaseUrl}/auth/register`;
  const loginPayload = {
    email: credentials.email,
    password: credentials.password,
  };

  const firstLoginAttempt = await postAuthEnvelope<unknown>(request, loginUrl, loginPayload);
  if (firstLoginAttempt.ok) {
    try {
      await sendAndVerifyEmail(request, credentials);
    } catch {
      // Likely already Active or send not needed for this identity.
    }
    return;
  }

  const registerAttempt = await postAuthEnvelope<unknown>(request, registerUrl, loginPayload);
  if (registerAttempt.ok) {
    // Register already sends a code; verify with captured code (or resend if stale).
    try {
      await sendAndVerifyEmail(request, credentials);
    } catch {
      // If send failed, try verify with code already emitted by register.
      const code = await waitForCapturedEmailCode(request, credentials, 'email-verify');
      const verifyAttempt = await postAuthEnvelope<unknown>(
        request,
        `${credentials.apiBaseUrl}/auth/email/verify`,
        { email: credentials.email, code, purpose: 'EmailVerify' },
      );
      if (!verifyAttempt.ok) {
        throw new Error(
          `Email verify failed for ${credentials.email}: ${
            verifyAttempt.error?.message ?? 'unknown verify error'
          }`,
        );
      }
    }
    const afterRegisterLogin = await postAuthEnvelope<unknown>(request, loginUrl, loginPayload);
    if (afterRegisterLogin.ok) {
      return;
    }
    throw new Error(
      `Registered ${credentials.email} and verified email, but login still failed: ${
        afterRegisterLogin.error?.message ?? 'unknown login error'
      }`,
    );
  }

  const secondLoginAttempt = await postAuthEnvelope<unknown>(request, loginUrl, loginPayload);
  if (secondLoginAttempt.ok) {
    try {
      await sendAndVerifyEmail(request, credentials);
    } catch {
      // ignore if already Active
    }
    return;
  }

  const loginError = firstLoginAttempt.error?.message ?? 'unknown login error';
  const registerError = registerAttempt.error?.message ?? 'unknown register error';
  throw new Error(
    `Unable to bootstrap e2e account ${credentials.email}. Login failed with "${loginError}", register failed with "${registerError}".`,
  );
}
