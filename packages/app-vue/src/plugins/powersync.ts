/**
 * PowerSync Vue Plugin
 *
 * Integrates @powersync/vue with the app-vue DI pattern.
 *
 * Host apps (web / desktop) are responsible for:
 *   1. Creating a `ShallowRef<AbstractPowerSyncDatabase | null>` that starts as null.
 *   2. Installing this plugin via `app.use(createPowerSyncVuePlugin(dbRef))`.
 *   3. Updating `dbRef.value` when PowerSync connects / disconnects.
 *
 * Vue components in app-vue can then use the re-exported `useQuery`, `useStatus`,
 * and `usePowerSync` composables from @powersync/vue. These composables react to
 * changes in the provided database ref.
 *
 * @module plugins/powersync
 */

import type { App, ShallowRef } from 'vue';
import type { AbstractPowerSyncDatabase } from '@powersync/common';
import { createPowerSyncPlugin } from '@powersync/vue';

// ── Re-exports from @powersync/vue (for consumers in app-vue components) ──
export { useQuery, usePowerSync, useStatus } from '@powersync/vue';

// ── Vue Plugin ──

/**
 * Creates a Vue plugin that provides the PowerSync database to the component tree.
 *
 * The plugin delegates to `@powersync/vue`'s `createPowerSyncPlugin`, passing
 * the reactive ref. When `dbRef.value` transitions from `null` to a live
 * `AbstractPowerSyncDatabase`, all `useQuery()` / `usePowerSync()` consumers
 * automatically pick up the change.
 *
 * @param dbRef - A `ShallowRef` that will hold the PowerSync database instance.
 *                Starts as `null` and gets set after authentication.
 *
 * @example
 * ```ts
 * // apps/web/src/main.ts
 * import { shallowRef } from 'vue';
 * import { createPowerSyncVuePlugin } from '@dailyuse/app-vue';
 *
 * const powerSyncDbRef = shallowRef(null);
 * app.use(createPowerSyncVuePlugin(powerSyncDbRef));
 * ```
 */
export function createPowerSyncVuePlugin(dbRef: ShallowRef<AbstractPowerSyncDatabase | null>) {
  // @powersync/vue's createPowerSyncPlugin wraps the database in ref(),
  // which for an already-reactive ref is a no-op (returns the same ref).
  // We delegate to it so that @powersync/vue's internal injection key
  // stays in sync with its composables (useQuery, usePowerSync, etc.).
  //
  // The type cast is necessary because the plugin expects
  // MaybeRef<AbstractPowerSyncDatabase> but our ref can be null before
  // auth completes. At runtime this is safe — useWatchedQuery gracefully
  // handles a null powerSync.value with an error state.
  return createPowerSyncPlugin({
    database: dbRef as unknown as AbstractPowerSyncDatabase,
  });
}
