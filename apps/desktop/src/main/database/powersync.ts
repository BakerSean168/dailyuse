/**
 * @file PowerSync Integration for Electron Main Process
 * @description
 *
 * Initialises a PowerSync database (backed by its own SQLite file) that keeps
 * the local dataset in sync with the Postgres backend via the self-hosted
 * PowerSync Service.
 *
 * Design decisions:
 *   - PowerSync's Node SDK (`@powersync/node`) internally manages its own
 *     `better-sqlite3` connection. We do NOT share the existing `dailyuse.sqlite`
 *     file — PowerSync writes to `dailyuse-sync.sqlite` in the same directory.
 *   - The connector obtains a PowerSync-specific RS256 JWT from the API's
 *     `/powersync/token` endpoint, authenticating via the existing HS256 access token.
 *   - CRUD uploads are batched to `/powersync/crud` in the API.
 *   - `connectPowerSync()` must be called AFTER the user is authenticated (i.e.
 *     the TokenManager has a valid access token). Call `disconnectPowerSync()`
 *     on logout or app shutdown.
 */

import { PowerSyncDatabase } from '@powersync/node';
import type {
  AbstractPowerSyncDatabase,
  PowerSyncBackendConnector,
  PowerSyncCredentials,
  CrudTransaction,
} from '@powersync/common';
import { app, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';

import { PowerSyncAppSchema } from '@dailyuse/database/powersync';
import { getTokenManager } from '../modules/authentication/infrastructure';
import { getApiBaseUrl } from '../utils/api-config';

// ──────────────────────────────────────────────
// Module state
// ──────────────────────────────────────────────

let powerSyncDb: PowerSyncDatabase | null = null;

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function getSyncDatabasePath(): string {
  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  return path.join(dbDir, 'dailyuse-sync.sqlite');
}

function getPowerSyncServiceUrl(): string {
  return process.env.POWERSYNC_URL || 'http://localhost:8080';
}

// ──────────────────────────────────────────────
// Backend Connector
// ──────────────────────────────────────────────

class DesktopPowerSyncConnector implements PowerSyncBackendConnector {
  private readonly apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = getApiBaseUrl();
  }

  /**
   * Fetches a short-lived RS256 JWT from the API, authenticating via the
   * existing HS256 access token stored in safeStorage.
   */
  async fetchCredentials(): Promise<PowerSyncCredentials> {
    const tokenManager = getTokenManager();
    const accessToken = await tokenManager.getAccessToken();

    if (!accessToken) {
      throw new Error('[PowerSync] No valid access token — user is not authenticated');
    }

    const response = await fetch(`${this.apiBaseUrl}/powersync/token`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`[PowerSync] Failed to fetch credentials: ${response.status} ${body}`);
    }

    const data = (await response.json()) as { token: string; expiresAt: string };

    return {
      endpoint: getPowerSyncServiceUrl(),
      token: data.token,
      expiresAt: new Date(data.expiresAt),
    };
  }

  /**
   * Uploads local CRUD operations to the backend.
   * The API's `/powersync/crud` endpoint applies them inside a Prisma $transaction.
   */
  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const tokenManager = getTokenManager();
    const accessToken = await tokenManager.getAccessToken();

    if (!accessToken) {
      throw new Error('[PowerSync] No valid access token — cannot upload data');
    }

    let transaction: CrudTransaction | null;

    while ((transaction = await database.getNextCrudTransaction()) !== null) {
      try {
        const ops = transaction.crud.map((op) => ({
          table: op.table,
          op: op.op,
          id: op.id,
          data: op.opData,
        }));

        const response = await fetch(`${this.apiBaseUrl}/powersync/crud`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ operations: ops }),
        });

        if (!response.ok) {
          const body = await response.text().catch(() => '');
          throw new Error(`[PowerSync] CRUD upload failed: ${response.status} ${body}`);
        }

        await transaction.complete();
      } catch (error) {
        console.error('[PowerSync] CRUD upload error:', error);
        throw error;
      }
    }
  }
}

// ──────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────

/**
 * Creates and connects the PowerSync database.
 * Call this AFTER the user has authenticated.
 */
export async function connectPowerSync(): Promise<PowerSyncDatabase> {
  if (powerSyncDb) {
    console.log('[PowerSync] Already connected');
    return powerSyncDb;
  }

  const dbPath = getSyncDatabasePath();
  console.log(`[PowerSync] Initializing sync database: ${dbPath}`);

  powerSyncDb = new PowerSyncDatabase({
    schema: PowerSyncAppSchema,
    database: { dbFilename: dbPath },
  });

  const connector = new DesktopPowerSyncConnector();
  await powerSyncDb.connect(connector);

  console.log('[PowerSync] Connected to PowerSync Service');
  return powerSyncDb;
}

/**
 * Disconnects and cleans up the PowerSync database.
 * Call this on logout or app shutdown.
 */
export async function disconnectPowerSync(): Promise<void> {
  if (!powerSyncDb) return;

  try {
    await powerSyncDb.disconnectAndClear();
    console.log('[PowerSync] Disconnected and cleared');
  } catch (error) {
    console.error('[PowerSync] Error during disconnect:', error);
  } finally {
    powerSyncDb = null;
  }
}

/**
 * Returns the active PowerSync database instance, or null if not connected.
 */
export function getPowerSyncDatabase(): PowerSyncDatabase | null {
  return powerSyncDb;
}

// ──────────────────────────────────────────────
// IPC Handlers for Renderer-side PowerSync
// ──────────────────────────────────────────────
// The renderer runs @powersync/web (wa-sqlite) and needs:
//   1. PowerSync credentials (RS256 JWT + endpoint) — fetched by main
//      process because it owns the HS256 access token via TokenManager.
//   2. CRUD upload proxy — main process forwards ops to the API because
//      the renderer has no direct API URL config.

/**
 * Registers IPC handlers that the renderer's PowerSync connector invokes.
 * Call this once during app initialisation (before any window is created).
 */
export function registerPowerSyncIpcHandlers(): void {
  const apiBaseUrl = getApiBaseUrl();

  // ── Fetch credentials ──
  ipcMain.handle('powersync:fetch-credentials', async () => {
    const tokenManager = getTokenManager();
    const accessToken = await tokenManager.getAccessToken();

    if (!accessToken) {
      throw new Error('[PowerSync] No valid access token — user is not authenticated');
    }

    const response = await fetch(`${apiBaseUrl}/powersync/token`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`[PowerSync] Failed to fetch credentials: ${response.status} ${body}`);
    }

    const data = (await response.json()) as { token: string; expiresAt: string };

    return {
      endpoint: getPowerSyncServiceUrl(),
      token: data.token,
      expiresAt: data.expiresAt,
    };
  });

  // ── CRUD upload proxy ──
  ipcMain.handle(
    'powersync:upload-crud',
    async (_, operations: Array<{ table: string; op: string; id: string; data: unknown }>) => {
      const tokenManager = getTokenManager();
      const accessToken = await tokenManager.getAccessToken();

      if (!accessToken) {
        throw new Error('[PowerSync] No valid access token — cannot upload data');
      }

      const response = await fetch(`${apiBaseUrl}/powersync/crud`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ operations }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`[PowerSync] CRUD upload failed: ${response.status} ${body}`);
      }
    },
  );
}
