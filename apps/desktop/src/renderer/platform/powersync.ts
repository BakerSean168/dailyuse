/**
 * Desktop Renderer — PowerSync Integration
 *
 * Initialises a PowerSync database (backed by wa-sqlite / WASM in the Electron
 * renderer) that keeps the client-side SQLite in sync with Postgres via the
 * self-hosted PowerSync Service.
 *
 * Design:
 *   - Uses `@powersync/web` (wa-sqlite + OPFS) — the renderer IS a Chromium
 *     browser, so the same SDK as the web app works unchanged.
 *   - The connector delegates credential fetching and CRUD uploads to the
 *     Electron main process via IPC, because the main process owns the HS256
 *     access token (stored in safeStorage via TokenManager) and has the API
 *     base URL configuration.
 *   - Call `connectDesktopPowerSync()` after the user authenticates.
 *   - Call `disconnectDesktopPowerSync()` on logout.
 */

import { PowerSyncDatabase } from '@powersync/web';
import type {
  AbstractPowerSyncDatabase,
  PowerSyncBackendConnector,
  PowerSyncCredentials,
  CrudTransaction,
} from '@powersync/common';
import { shallowRef } from 'vue';

import { PowerSyncAppSchema } from '@dailyuse/database/powersync';

// ──────────────────────────────────────────────
// Module state
// ──────────────────────────────────────────────

let powerSyncDb: PowerSyncDatabase | null = null;

/**
 * Reactive ref exposed to main.ts for the PowerSync Vue plugin.
 * Starts as `null`; updated when PowerSync connects / disconnects.
 * The `createPowerSyncVuePlugin(powerSyncDbRef)` call in main.ts
 * wires this into @powersync/vue's injection context.
 */
export const powerSyncDbRef = shallowRef<AbstractPowerSyncDatabase | null>(null);

// ──────────────────────────────────────────────
// IPC helpers
// ──────────────────────────────────────────────

const api = window.electronAPI;

// ──────────────────────────────────────────────
// Backend Connector
// ──────────────────────────────────────────────

class DesktopRendererPowerSyncConnector implements PowerSyncBackendConnector {
  /**
   * Fetches a short-lived RS256 JWT from the API via an IPC call to the main
   * process. The main process authenticates with its locally-stored HS256
   * access token and returns the PowerSync-specific credentials.
   */
  async fetchCredentials(): Promise<PowerSyncCredentials> {
    const data = await api.invoke<{
      endpoint: string;
      token: string;
      expiresAt: string;
    }>('powersync:fetch-credentials');

    return {
      endpoint: data.endpoint,
      token: data.token,
      expiresAt: new Date(data.expiresAt),
    };
  }

  /**
   * Uploads local CRUD operations to the backend via an IPC call.
   * The main process forwards them to the API's `/powersync/crud` endpoint.
   */
  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    let transaction: CrudTransaction | null;

    while ((transaction = await database.getNextCrudTransaction()) !== null) {
      try {
        const ops = transaction.crud.map((op) => ({
          table: op.table,
          op: op.op,
          id: op.id,
          data: op.opData,
        }));

        await api.invoke('powersync:upload-crud', ops);
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
 * Creates and connects the PowerSync database in the renderer.
 * Call this AFTER the user has authenticated.
 */
export async function connectDesktopPowerSync(): Promise<PowerSyncDatabase> {
  if (powerSyncDb) {
    console.log('[PowerSync] Already connected');
    return powerSyncDb;
  }

  console.log('[PowerSync] Initializing renderer sync database (wa-sqlite)…');

  powerSyncDb = new PowerSyncDatabase({
    schema: PowerSyncAppSchema,
    database: { dbFilename: 'dailyuse-sync.db' },
  });

  const connector = new DesktopRendererPowerSyncConnector();
  await powerSyncDb.connect(connector);

  // Update the reactive ref so @powersync/vue composables pick it up
  powerSyncDbRef.value = powerSyncDb;

  console.log('[PowerSync] Connected to PowerSync Service');
  return powerSyncDb;
}

/**
 * Disconnects and cleans up the PowerSync database.
 * Call this on logout.
 */
export async function disconnectDesktopPowerSync(): Promise<void> {
  if (!powerSyncDb) return;

  try {
    await powerSyncDb.disconnectAndClear();
    console.log('[PowerSync] Disconnected and cleared');
  } catch (error) {
    console.error('[PowerSync] Error during disconnect:', error);
  } finally {
    powerSyncDb = null;
    powerSyncDbRef.value = null;
  }
}
