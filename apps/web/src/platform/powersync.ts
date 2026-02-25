/**
 * Web Platform — PowerSync Integration
 *
 * Initialises a PowerSync database (backed by wa-sqlite / OPFS in the browser)
 * that keeps the client-side SQLite in sync with Postgres via the self-hosted
 * PowerSync Service.
 *
 * Design:
 *   - `@powersync/web` uses wa-sqlite (WASM) with the OPFS VFS for persistence.
 *   - The connector fetches RS256 JWTs from `/api/v1/powersync/token`, authenticating
 *     with the existing HS256 access token from the Pinia auth store.
 *   - CRUD operations are uploaded to `/api/v1/powersync/crud`.
 *   - Call `connectWebPowerSync()` after the user authenticates.
 *   - Call `disconnectWebPowerSync()` on logout.
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
import { useAuthenticationStore } from '@dailyuse/app-vue';

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
// Config
// ──────────────────────────────────────────────

function getPowerSyncServiceUrl(): string {
  return (import.meta as any).env?.VITE_POWERSYNC_URL || 'http://localhost:8080';
}

function getApiBaseUrl(): string {
  return '/api/v1';
}

// ──────────────────────────────────────────────
// Backend Connector
// ──────────────────────────────────────────────

class WebPowerSyncConnector implements PowerSyncBackendConnector {
  /**
   * Fetches a short-lived RS256 JWT from the API.
   * Uses the existing HS256 access token from the Pinia auth store.
   */
  async fetchCredentials(): Promise<PowerSyncCredentials> {
    const authStore = useAuthenticationStore();
    const accessToken = authStore.accessToken;

    if (!accessToken) {
      throw new Error('[PowerSync] No access token — user is not authenticated');
    }

    const response = await fetch(`${getApiBaseUrl()}/powersync/token`, {
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
   */
  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const authStore = useAuthenticationStore();
    const accessToken = authStore.accessToken;

    if (!accessToken) {
      throw new Error('[PowerSync] No access token — cannot upload data');
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

        const response = await fetch(`${getApiBaseUrl()}/powersync/crud`, {
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
export async function connectWebPowerSync(): Promise<PowerSyncDatabase> {
  if (powerSyncDb) {
    console.log('[PowerSync] Already connected');
    return powerSyncDb;
  }

  console.log('[PowerSync] Initializing web sync database…');

  powerSyncDb = new PowerSyncDatabase({
    schema: PowerSyncAppSchema,
    database: { dbFilename: 'dailyuse-sync.db' },
  });

  const connector = new WebPowerSyncConnector();
  await powerSyncDb.connect(connector);

  // Update the reactive ref so @powersync/vue composables (useQuery, etc.) pick it up
  powerSyncDbRef.value = powerSyncDb;

  console.log('[PowerSync] Connected to PowerSync Service');
  return powerSyncDb;
}

/**
 * Disconnects and cleans up the PowerSync database.
 * Call this on logout.
 */
export async function disconnectWebPowerSync(): Promise<void> {
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

/**
 * Returns the active PowerSync database instance, or null if not connected.
 */
export function getWebPowerSyncDatabase(): PowerSyncDatabase | null {
  return powerSyncDb;
}
