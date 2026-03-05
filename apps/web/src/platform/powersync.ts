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
import { resultHttpClient } from './http';

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
   * 
   * 使用 resultHttpClient 而不是 fetch，以便自动处理 401 token 刷新：
   * - 如果 accessToken 过期，会自动调用 onTokenRefresh 刷新
   * - 如果刷新失败，会调用 onUnauthorized() 导航到登录页
   */
  async fetchCredentials(): Promise<PowerSyncCredentials> {
    const authStore = useAuthenticationStore();

    // 确保有 accessToken
    if (!authStore.accessToken) {
      throw new Error('[PowerSync] No access token — user is not authenticated');
    }

    // 使用 resultHttpClient 获取 PowerSync token
    // 这样可以自动处理 401 和 token 刷新
    const result = await resultHttpClient.get<{
      token: string;
      endpoint: string;
      expiresIn: number;
    }>('/powersync/token');

    if (!result.ok) {
      // 虽然 resultHttpClient 已处理 401，但如果仍然失败（如网络错误），则抛出
      throw new Error(
        `[PowerSync] Failed to fetch credentials: ${result.error.code} ${result.error.message}`
      );
    }

    // 计算 expiresAt：现在 + expiresIn 秒
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + result.data.expiresIn);

    return {
      endpoint: result.data.endpoint,
      token: result.data.token,
      expiresAt,
    };
  }

  /**
   * Uploads local CRUD operations to the backend.
   * 
   * 使用 resultHttpClient 处理 401 自动 token 刷新。
   */
  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const authStore = useAuthenticationStore();

    if (!authStore.accessToken) {
      throw new Error('[PowerSync] No access token — cannot upload data');
    }

    let transaction: CrudTransaction | null;

    while ((transaction = await database.getNextCrudTransaction()) !== null) {
      try {
        // 构建后端期望的格式：{ transactions: [{ ops: [...] }] }
        const ops = transaction.crud.map((op) => ({
          op: op.op,      // 'PUT' | 'PATCH' | 'DELETE'
          type: op.table,  // 表名
          id: op.id,
          data: op.opData,
        }));

        const result = await resultHttpClient.put<{ success: boolean }>(
          '/powersync/crud',
          { transactions: [{ ops }] }  // 后端期望的格式
        );

        if (!result.ok) {
          throw new Error(
            `[PowerSync] CRUD upload failed: ${result.error.code} ${result.error.message}`
          );
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
