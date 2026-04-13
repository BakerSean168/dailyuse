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

export async function ensureE2EAccount(
  request: APIRequestContext,
  credentials: SyncCredentials,
): Promise<void> {
  // The suite tolerates either an existing seeded account or first-run account
  // creation. This keeps local sync regression setup lightweight.
  const loginUrl = `${credentials.apiBaseUrl}/auth/login`;
  const registerUrl = `${credentials.apiBaseUrl}/auth/register`;
  const loginPayload = {
    email: credentials.email,
    password: credentials.password,
  };

  const firstLoginAttempt = await postAuthEnvelope<unknown>(request, loginUrl, loginPayload);
  if (firstLoginAttempt.ok) {
    return;
  }

  const registerAttempt = await postAuthEnvelope<unknown>(request, registerUrl, loginPayload);
  if (registerAttempt.ok) {
    return;
  }

  const secondLoginAttempt = await postAuthEnvelope<unknown>(request, loginUrl, loginPayload);
  if (secondLoginAttempt.ok) {
    return;
  }

  const loginError = firstLoginAttempt.error?.message ?? 'unknown login error';
  const registerError = registerAttempt.error?.message ?? 'unknown register error';
  throw new Error(
    `Unable to bootstrap e2e account ${credentials.email}. Login failed with "${loginError}", register failed with "${registerError}".`,
  );
}
