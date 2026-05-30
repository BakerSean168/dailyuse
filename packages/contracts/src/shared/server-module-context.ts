/**
 * Server Module Context — shared contract for API module registration.
 *
 * Feature packages extend this interface with their concrete DbClient type
 * (typically PrismaClient from @dailyuse/database) to eliminate the
 * `db: unknown` + `as PrismaClient` cast pattern.
 *
 * @example
 * ```typescript
 * import type { ServerModuleContext } from '@dailyuse/contracts/shared';
 * import type { PrismaClient } from '@dailyuse/database';
 *
 * interface GovernanceModuleContext extends ServerModuleContext<PrismaClient> {}
 * ```
 */

/**
 * Typed base context for server-side API module registration.
 *
 * @typeParam DbClient - The concrete database client type (e.g. PrismaClient).
 *   Defaults to `unknown` for backward compatibility during migration.
 */
export interface ServerModuleContext<DbClient = unknown> {
  readonly app: import('express').Express;
  readonly router: import('express').Router;
  readonly db: DbClient;
  readonly middleware: {
    readonly auth: import('express').RequestHandler;
    requireRole(roles: string[]): import('express').RequestHandler;
  };
  readonly openApiRegistry?: {
    registerPath(route: Record<string, unknown>): void;
    register(name: string, schema: unknown): void;
  };
}
