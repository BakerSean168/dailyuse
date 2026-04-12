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
 *     SQLite connection, but it now points at the unified desktop business
 *     database file so sync and local business reads observe the same data.
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
import { BrowserWindow, app } from 'electron';
import path from 'path';
import fs from 'fs';
import { Worker } from 'node:worker_threads';

import { PowerSyncAppSchema } from '@dailyuse/database/powersync';
import { getTokenManager } from '../modules/authentication/infrastructure';
import { getApiBaseUrl } from '../utils/api-config';
import { getUnifiedDatabasePath } from './paths';

// ──────────────────────────────────────────────
// Module state
// ──────────────────────────────────────────────

let powerSyncDb: PowerSyncDatabase | null = null;
let syncConnected = false;

// Concurrency guards — prevent duplicate instances when two callers race.
let connectingPromise: Promise<PowerSyncDatabase> | null = null;
let openingPromise: Promise<PowerSyncDatabase> | null = null;

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function getSyncDatabasePath(): string {
  const dbPath = getUnifiedDatabasePath();
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  return dbPath;
}

function resolvePackagedWorkerPath(workerPath: string): string {
  if (!app.isPackaged) {
    return workerPath;
  }

  const asarSegment = `${path.sep}app.asar${path.sep}`;
  const unpackedSegment = `${path.sep}app.asar.unpacked${path.sep}`;

  if (!workerPath.includes(asarSegment)) {
    return workerPath;
  }

  const candidatePath = workerPath.replace(asarSegment, unpackedSegment);
  return fs.existsSync(candidatePath) ? candidatePath : workerPath;
}

function createPowerSyncDatabase(dbPath: string): PowerSyncDatabase {
  return new PowerSyncDatabase({
    schema: PowerSyncAppSchema,
    database: {
      dbFilename: dbPath,
      openWorker: (filename, options) => {
        const resolvedFilename =
          typeof filename === 'string' ? resolvePackagedWorkerPath(filename) : filename;

        return new Worker(resolvedFilename, options);
      },
    },
  });
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

    const payload = (await response.json()) as {
      ok: boolean;
      data?: {
        token?: string;
        endpoint?: string;
        expiresIn?: number;
      };
      message?: string;
    };

    if (
      !payload?.ok ||
      !payload.data?.token ||
      !payload.data?.endpoint ||
      !payload.data?.expiresIn
    ) {
      throw new Error(
        `[PowerSync] Invalid credentials response contract from API: ${JSON.stringify(payload)}`,
      );
    }

    const expiresAt = new Date(Date.now() + payload.data.expiresIn * 1000);
    console.log('[PowerSync] Credentials fetched', {
      endpoint: payload.data.endpoint,
      expiresAt: expiresAt.toISOString(),
      tokenPrefix: `${payload.data.token.slice(0, 10)}...`,
    });

    return {
      endpoint: payload.data.endpoint,
      token: payload.data.token,
      expiresAt,
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

        const tableCounts = ops.reduce<Record<string, number>>((acc, op) => {
          acc[op.table] = (acc[op.table] ?? 0) + 1;
          return acc;
        }, {});
        const includesGoals = Object.keys(tableCounts).some((table) => table.includes('goal'));
        console.log('[PowerSync] Uploading CRUD transaction', {
          opCount: ops.length,
          tableCounts,
          includesGoals,
        });

        const response = await fetch(`${this.apiBaseUrl}/powersync/crud`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactions: [
              {
                ops,
              },
            ],
          }),
        });

        if (!response.ok) {
          const body = await response.text().catch(() => '');
          throw new Error(`[PowerSync] CRUD upload failed: ${response.status} ${body}`);
        }

        console.log('[PowerSync] CRUD transaction uploaded successfully', {
          opCount: ops.length,
          includesGoals,
        });

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
 *
 * Guarded against concurrent calls — if a connection is already in
 * progress the same promise is returned.
 */
export async function connectPowerSync(): Promise<PowerSyncDatabase> {
  if (connectingPromise) {
    console.log('[PowerSync] Connection already in progress, waiting…');
    return connectingPromise;
  }

  if (powerSyncDb && syncConnected) {
    console.log('[PowerSync] Already connected (sync mode)');
    return powerSyncDb;
  }

  if (powerSyncDb && !syncConnected) {
    connectingPromise = (async () => {
      console.log('[PowerSync] Promoting existing local-only instance to sync mode');
      const connector = new DesktopPowerSyncConnector();
      await powerSyncDb!.connect(connector);
      syncConnected = true;
      console.log('[PowerSync] Connected to PowerSync Service (promoted)');
      return powerSyncDb!;
    })();

    try {
      return await connectingPromise;
    } finally {
      connectingPromise = null;
    }
  }

  connectingPromise = (async () => {
    const dbPath = getSyncDatabasePath();
    console.log(`[PowerSync] Initializing sync database: ${dbPath}`);

    const db = createPowerSyncDatabase(dbPath);

    const connector = new DesktopPowerSyncConnector();
    await db.connect(connector);

    powerSyncDb = db;
    syncConnected = true;

    // Start broadcasting table changes to renderer windows
    startChangeBroadcast(db);

    console.log('[PowerSync] Connected to PowerSync Service');
    return db;
  })();

  try {
    return await connectingPromise;
  } finally {
    connectingPromise = null;
  }
}

/**
 * Opens the PowerSync database in local-only mode (no sync).
 *
 * Used for OFFLINE_USER and GUEST auth modes where no auth token is available
 * or cloud sync is not desired. Data is read/written locally to dailyuse-sync.sqlite
 * without connecting to the PowerSync Service.
 *
 * If PowerSync is already connected (sync mode), returns the existing instance.
 * Guarded against concurrent calls.
 */
export async function openPowerSyncLocalOnly(): Promise<PowerSyncDatabase> {
  if (powerSyncDb) {
    console.log('[PowerSync] Already open (reusing existing instance)');
    return powerSyncDb;
  }
  if (openingPromise) {
    console.log('[PowerSync] Local-only open already in progress, waiting…');
    return openingPromise;
  }

  openingPromise = (async () => {
    const dbPath = getSyncDatabasePath();
    console.log(`[PowerSync] Opening local-only database: ${dbPath}`);

    const db = createPowerSyncDatabase(dbPath);
    console.log('[PowerSync] Waiting for local-only database to become ready...');
    await db.waitForReady();
    console.log('[PowerSync] Local-only database is ready');

    powerSyncDb = db;
    syncConnected = false;

    // Do NOT call db.connect(connector) — local-only mode
    // Just initialize the database and start change broadcast
    startChangeBroadcast(db);

    console.log('[PowerSync] Local-only mode active (no sync)');
    return db;
  })();

  try {
    return await openingPromise;
  } finally {
    openingPromise = null;
  }
}

/**
 * Upgrades a local-only PowerSync instance to sync mode by attaching a connector.
 * Used when OFFLINE_USER recovers network and gets promoted to ONLINE_USER.
 */
export async function promotePowerSyncToSync(): Promise<void> {
  if (!powerSyncDb) {
    console.warn('[PowerSync] No database instance to promote — call connectPowerSync() instead');
    return;
  }

  if (syncConnected) {
    console.log('[PowerSync] Already in sync mode');
    return;
  }

  const connector = new DesktopPowerSyncConnector();
  await powerSyncDb.connect(connector);
  syncConnected = true;
  console.log('[PowerSync] Promoted to sync mode');
}

/**
 * Disconnects and cleans up the PowerSync database.
 * Wipes the local sync data — use on LOGOUT only.
 */
export async function disconnectPowerSync(): Promise<void> {
  if (!powerSyncDb) return;

  try {
    // Stop broadcasting before disconnecting
    stopChangeBroadcast();
    await powerSyncDb.disconnectAndClear();
    console.log('[PowerSync] Disconnected and cleared');
  } catch (error) {
    console.error('[PowerSync] Error during disconnect:', error);
  } finally {
    syncConnected = false;
    powerSyncDb = null;
  }
}

/**
 * Gracefully shuts down the PowerSync database WITHOUT wiping local data.
 * Use on app quit to preserve the sync cache for the next cold start.
 */
export async function shutdownPowerSync(): Promise<void> {
  if (!powerSyncDb) return;

  try {
    stopChangeBroadcast();
    await powerSyncDb.disconnect();
    console.log('[PowerSync] Shut down gracefully (data preserved)');
  } catch (error) {
    console.error('[PowerSync] Error during shutdown:', error);
  } finally {
    syncConnected = false;
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
// Change Broadcast
// ──────────────────────────────────────────────

/** Unsubscribe handle returned by onChange; stored so we can tear it down. */
let onChangeDispose: (() => void) | null = null;

/**
 * Starts listening for table changes on the PowerSync database and
 * broadcasts `db:changed` events to all renderer windows.
 *
 * The event payload is `{ tables: string[] }` — table names only.
 * Renderers re-fetch affected data via their existing IPC adapters.
 */
function startChangeBroadcast(db: PowerSyncDatabase): void {
  if (onChangeDispose) return; // already listening

  onChangeDispose = db.onChange({
    onChange: (event) => {
      const tables = event.changedTables;
      if (tables.length === 0) return;

      const includesGoals = tables.some((table) => table.includes('goal'));
      console.log('[PowerSync] Changed tables detected', {
        tables,
        includesGoals,
      });

      // Broadcast to every open BrowserWindow
      for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) {
          win.webContents.send('db:changed', { tables });
        }
      }
    },
  });

  console.log('[PowerSync] Change broadcast started');
}

/**
 * Stops the change broadcast listener.
 */
function stopChangeBroadcast(): void {
  if (onChangeDispose) {
    onChangeDispose();
    onChangeDispose = null;
    console.log('[PowerSync] Change broadcast stopped');
  }
}
