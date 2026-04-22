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
import { serializeCrudTransaction } from './powersync-crud';

const NON_SYNCABLE_LOCAL_TABLES = [
  'accounts',
  'auth_credentials',
  'auth_identifiers',
  'auth_identities',
  'auth_sessions',
] as const;

const PRE_HYDRATION_BOOTSTRAP_SYNC_TABLES = [
  'user_settings',
  'repositories',
  'editor_workspaces',
  'editor_workspace_sessions',
  'editor_workspace_session_groups',
  'editor_workspace_session_group_tabs',
] as const;

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

async function purgeNonSyncableLocalCrud(
  db: Pick<PowerSyncDatabase, 'writeTransaction'>,
): Promise<void> {
  const placeholders = NON_SYNCABLE_LOCAL_TABLES.map(() => '?').join(', ');

  await db.writeTransaction(async (tx) => {
    const queuedCrud = await tx.get<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM ps_crud
       WHERE json_extract(data, '$.type') IN (${placeholders})`,
      [...NON_SYNCABLE_LOCAL_TABLES],
    );

    const queuedRows = await tx.get<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM ps_updated_rows
       WHERE row_type IN (${placeholders})`,
      [...NON_SYNCABLE_LOCAL_TABLES],
    );

    if (queuedCrud.count === 0 && queuedRows.count === 0) {
      return;
    }

    console.log('[PowerSync] Purging non-syncable local CRUD rows', {
      queuedCrud: queuedCrud.count,
      queuedRows: queuedRows.count,
      tables: NON_SYNCABLE_LOCAL_TABLES,
    });

    await tx.execute(
      `DELETE FROM ps_crud
       WHERE json_extract(data, '$.type') IN (${placeholders})`,
      [...NON_SYNCABLE_LOCAL_TABLES],
    );

    await tx.execute(
      `DELETE FROM ps_updated_rows
       WHERE row_type IN (${placeholders})`,
      [...NON_SYNCABLE_LOCAL_TABLES],
    );
  });
}

async function purgePreHydrationBootstrapCrud(
  db: Pick<PowerSyncDatabase, 'writeTransaction'>,
): Promise<void> {
  const placeholders = PRE_HYDRATION_BOOTSTRAP_SYNC_TABLES.map(() => '?').join(', ');

  await db.writeTransaction(async (tx) => {
    const pendingUserBucket = await tx.getOptional<{
      name: string;
      last_op: number;
      last_applied_op: number;
    }>(
      `SELECT name, last_op, last_applied_op
       FROM ps_buckets
       WHERE name LIKE '1#user_data[%]'
         AND last_op > 0
         AND last_applied_op = 0
       ORDER BY id DESC
       LIMIT 1`,
    );

    if (!pendingUserBucket) {
      return;
    }

    const queuedCrud = await tx.get<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM ps_crud
       WHERE json_extract(data, '$.type') IN (${placeholders})`,
      [...PRE_HYDRATION_BOOTSTRAP_SYNC_TABLES],
    );

    const queuedRows = await tx.get<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM ps_updated_rows
       WHERE row_type IN (${placeholders})`,
      [...PRE_HYDRATION_BOOTSTRAP_SYNC_TABLES],
    );

    if (queuedCrud.count === 0 && queuedRows.count === 0) {
      return;
    }

    console.log('[PowerSync] Purging pre-hydration bootstrap CRUD rows', {
      bucket: pendingUserBucket.name,
      lastOp: pendingUserBucket.last_op,
      lastAppliedOp: pendingUserBucket.last_applied_op,
      queuedCrud: queuedCrud.count,
      queuedRows: queuedRows.count,
      tables: PRE_HYDRATION_BOOTSTRAP_SYNC_TABLES,
    });

    await tx.execute(
      `DELETE FROM ps_crud
       WHERE json_extract(data, '$.type') IN (${placeholders})`,
      [...PRE_HYDRATION_BOOTSTRAP_SYNC_TABLES],
    );

    await tx.execute(
      `DELETE FROM ps_updated_rows
       WHERE row_type IN (${placeholders})`,
      [...PRE_HYDRATION_BOOTSTRAP_SYNC_TABLES],
    );
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
        const ops = serializeCrudTransaction(transaction);

        const tableCounts = ops.reduce<Record<string, number>>((acc, op) => {
          acc[op.type] = (acc[op.type] ?? 0) + 1;
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
      await purgeNonSyncableLocalCrud(powerSyncDb!);
      await purgePreHydrationBootstrapCrud(powerSyncDb!);
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
    await db.waitForReady();
    await purgeNonSyncableLocalCrud(db);
    await purgePreHydrationBootstrapCrud(db);

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
 * Ensures the PowerSync database is running in sync mode.
 *
 * If a local-only instance already exists, it is promoted by attaching a
 * connector. If no instance exists yet, a new sync-mode connection is created.
 */
export async function ensurePowerSyncSyncMode(): Promise<PowerSyncDatabase> {
  if (!powerSyncDb) {
    console.log('[PowerSync] No local instance open, establishing sync mode directly');
    return await connectPowerSync();
  }

  if (syncConnected) {
    console.log('[PowerSync] Already in sync mode');
    return powerSyncDb;
  }

  await purgeNonSyncableLocalCrud(powerSyncDb);
  await purgePreHydrationBootstrapCrud(powerSyncDb);
  const connector = new DesktopPowerSyncConnector();
  await powerSyncDb.connect(connector);
  syncConnected = true;
  console.log('[PowerSync] Promoted to sync mode');
  return powerSyncDb;
}

/**
 * @deprecated Use ensurePowerSyncSyncMode() for a self-contained sync-mode entrypoint.
 */
export async function promotePowerSyncToSync(): Promise<void> {
  await ensurePowerSyncSyncMode();
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
