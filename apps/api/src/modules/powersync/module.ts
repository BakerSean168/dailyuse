/**
 * @file PowerSync API Module
 * @description Provides authentication and CRUD endpoints for PowerSync sync service.
 *
 * PowerSync requires two backend endpoints:
 * 1. Auth endpoint — issues RS256 JWTs that PowerSync Service verifies via JWKS
 * 2. CRUD endpoint — receives batched write operations from clients and applies them to Postgres via Prisma
 *
 * This module is registered directly in the API bootstrapper (not in a domain package)
 * because it's infrastructure-level, not a domain concern.
 */

import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { ResultCode } from '@dailyuse/contracts/result';
import { createLogger } from '@dailyuse/utils';
import type { IApiModule, IApiModuleContext } from '../../shared/contracts/api-module.js';
import { getPowerSyncConfig } from '../../shared/infrastructure/config/env.js';
import type { AuthenticatedRequest } from '../../shared/infrastructure/http/middlewares/auth-middleware.js';
import { createApiResponseBuilder } from '../../shared/infrastructure/http/response-builder.js';
import { readStoredProfileSnapshotManifest } from './snapshot-storage.js';

const logger = createLogger('PowerSync');

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

const JSON_FIELDS_BY_TABLE: Record<string, ReadonlySet<string>> = {
  accounts: new Set(['profile', 'settings']),
  user_settings: new Set(['preferences']),
  repositories: new Set(['config', 'stats']),
  folders: new Set(['metadata']),
  resources: new Set(['metadata', 'stats']),
  editor_workspaces: new Set(['layout', 'setting']),
  editor_workspace_sessions: new Set(['layout']),
  editor_workspace_session_group_tabs: new Set(['view_state']),
  ai_knowledge_index_entries: new Set(['keywords', 'embedding', 'chunks', 'metadata']),
  dashboard_configs: new Set(['widget_config']),
};

const BOOLEAN_FIELDS_BY_TABLE: Record<string, ReadonlySet<string>> = {
  accounts: new Set(['email_is_verified', 'email_is_primary', 'phone_is_verified']),
  goal_folders: new Set(['is_system_folder']),
  focus_modes: new Set(['is_active']),
  task_templates: new Set(['reminder_config_enabled', 'is_blocked']),
  schedules: new Set(['has_conflict']),
  schedule_tasks: new Set(['enabled']),
  reminder_templates: new Set([
    'self_enabled',
    'is_auto_adjusted',
    'user_confirmed',
    'smart_frequency_enabled',
  ]),
  reminder_groups: new Set(['enabled']),
  reminder_history: new Set(['notification_sent']),
  user_reminder_preferences: new Set(['global_reminder_enabled', 'global_smart_frequency']),
  notifications: new Set(['is_read']),
  notification_preferences: new Set(['enabled']),
  notification_templates: new Set(['is_system', 'is_active']),
  ai_provider_configs: new Set(['is_active', 'is_default']),
  folders: new Set(['is_expanded']),
  editor_workspaces: new Set(['is_active']),
  editor_workspace_sessions: new Set(['is_active']),
  editor_workspace_session_group_tabs: new Set(['is_pinned', 'is_active']),
};

function parseJsonLikeString(value: string): unknown {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    return JSON.parse(trimmed);
  }

  return value;
}

function normalizeBooleanLikeValue(value: unknown): unknown {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === '1' || trimmed === 'true') return true;
    if (trimmed === '0' || trimmed === 'false') return false;
  }

  return value;
}

function normalizeCrudValue(tableName: string, key: string, value: unknown): unknown {
  if (JSON_FIELDS_BY_TABLE[tableName]?.has(key) && typeof value === 'string') {
    try {
      return parseJsonLikeString(value);
    } catch {
      return value;
    }
  }

  if (BOOLEAN_FIELDS_BY_TABLE[tableName]?.has(key)) {
    return normalizeBooleanLikeValue(value);
  }

  return value;
}

function normalizeCrudData(
  tableName: string,
  data: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!data) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      snakeToCamel(key),
      normalizeCrudValue(tableName, key, value),
    ]),
  );
}

/**
 * Tables that have an `identity_id` column (mapped to `identityId` in Prisma).
 * Used to automatically inject the authenticated user's identity on write operations.
 *
 * NOTE: `accounts` is NOT included — its `id` IS the identity, not a foreign key.
 * Tables like `linked_contents`, `resource_references`, `notification_templates`,
 * `rules`, and `rule_revisions` do not have `identityId`.
 */
const IDENTITY_ID_TABLES = new Set([
  'user_settings',
  'goals',
  'goal_folders',
  'goal_statistics',
  'focus_sessions',
  'focus_modes',
  'key_results',
  'goal_records',
  'goal_reviews',
  'key_result_weight_snapshots',
  'task_folders',
  'task_templates',
  'task_instances',
  'task_statistics',
  'task_dependencies',
  'task_template_history',
  'schedules',
  'schedule_jobs',
  'schedule_tasks',
  'schedule_statistics',
  'schedule_executions',
  'reminder_templates',
  'reminder_groups',
  'reminder_instances',
  'reminder_statistics',
  'user_reminder_preferences',
  'reminder_history',
  'reminder_responses',
  'notifications',
  'notification_preferences',
  'notification_channels',
  'notification_history',
  'editor_workspaces',
  'editor_workspace_sessions',
  'editor_workspace_session_groups',
  'editor_workspace_session_group_tabs',
  'documents',
  'document_versions',
  'document_links',
  'ai_conversations',
  'ai_messages',
  'ai_generation_tasks',
  'ai_usage_quotas',
  'ai_provider_configs',
  'knowledge_generation_tasks',
  'dashboard_configs',
  'repositories',
  'repository_explorers',
  'repository_statistics',
  'folders',
  'resources',
  'repository_resources',
]);

/**
 * Maps PowerSync CRUD operation table names to Prisma model delegates.
 * PowerSync sends table names as they appear in the sync rules (SQL table names).
 * We map them to the corresponding Prisma model accessor.
 */
function getPrismaDelegate(db: any, tableName: string): any {
  // Map SQL table name -> Prisma model accessor name
  const tableMap: Record<string, string> = {
    accounts: 'account',
    user_settings: 'userSetting',
    goals: 'goal',
    goal_folders: 'goalFolder',
    goal_statistics: 'goalStatistic',
    focus_sessions: 'focusSession',
    focus_modes: 'focusMode',
    key_results: 'keyResult',
    goal_records: 'goalRecord',
    goal_reviews: 'goalReview',
    key_result_weight_snapshots: 'keyResultWeightSnapshot',
    task_folders: 'taskFolder',
    task_templates: 'taskTemplate',
    task_instances: 'taskInstance',
    task_statistics: 'taskStatistic',
    task_dependencies: 'taskDependency',
    task_template_history: 'taskTemplateHistory',
    schedules: 'schedule',
    schedule_jobs: 'scheduleJob',
    schedule_tasks: 'scheduleTask',
    schedule_statistics: 'scheduleStatistic',
    schedule_executions: 'scheduleExecution',
    reminder_templates: 'reminderTemplate',
    reminder_groups: 'reminderGroup',
    reminder_instances: 'reminderInstance',
    reminder_statistics: 'reminderStatistic',
    user_reminder_preferences: 'userReminderPreference',
    reminder_history: 'reminderHistory',
    reminder_responses: 'reminderResponse',
    notifications: 'notification',
    notification_preferences: 'notificationPreference',
    notification_channels: 'notificationChannel',
    notification_history: 'notificationHistory',
    notification_templates: 'notificationTemplate',
    editor_workspaces: 'editorWorkspace',
    editor_workspace_sessions: 'editorWorkspaceSession',
    editor_workspace_session_groups: 'editorWorkspaceSessionGroup',
    editor_workspace_session_group_tabs: 'editorWorkspaceSessionGroupTab',
    documents: 'document',
    document_versions: 'documentVersion',
    document_links: 'documentLink',
    ai_conversations: 'aiConversation',
    ai_messages: 'aiMessage',
    ai_generation_tasks: 'aiGenerationTask',
    ai_usage_quotas: 'aiUsageQuota',
    ai_provider_configs: 'aiProviderConfig',
    dashboard_configs: 'dashboardConfig',
    knowledge_generation_tasks: 'knowledgeGenerationTask',
    repositories: 'repository',
    repository_explorers: 'repositoryExplorer',
    repository_statistics: 'repositoryStatistic',
    folders: 'folder',
    resources: 'resource',
    repository_resources: 'repositoryResource',
    linked_contents: 'linkedContent',
    resource_references: 'resourceReference',
    rules: 'rule',
    rule_revisions: 'ruleRevision',
  };

  const modelName = tableMap[tableName];
  if (!modelName || !(modelName in db)) {
    return null;
  }
  return db[modelName];
}

export const PowerSyncApiModule: IApiModule = {
  name: 'PowerSync',

  register(context: IApiModuleContext) {
    const { router, db, middleware } = context;
    const psRouter = Router();
    const config = getPowerSyncConfig();

    // =========================================================================
    // GET /powersync/token — Issue a PowerSync-specific RS256 JWT
    // =========================================================================
    // The client calls this after authenticating with the main API (HS256).
    // Returns a short-lived RS256 JWT that PowerSync Service verifies via JWKS.
    // =========================================================================
    psRouter.get('/token', middleware.auth, (req, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      const responseBuilder = createApiResponseBuilder(authenticatedReq);

      try {
        if (!config.privateKey) {
          logger.error('PowerSync private key not configured');
          return res
            .status(503)
            .json(
              responseBuilder.error(
                ResultCode.SERVICE_UNAVAILABLE,
                'PowerSync sync is not configured',
              ),
            );
        }

        if (!authenticatedReq.identityId) {
          return res.status(401).json(responseBuilder.unauthorized('未授权，请登录'));
        }

        // Sign a short-lived RS256 JWT for PowerSync
        const token = jwt.sign(
          {
            sub: authenticatedReq.identityId,
            aud: 'powersync-dev',
          },
          config.privateKey,
          {
            algorithm: 'RS256',
            expiresIn: '5m', // Short-lived; client refreshes via fetchCredentials()
            keyid: config.keyId,
          } as jwt.SignOptions,
        );

        logger.info('Issued PowerSync token', {
          identityId: authenticatedReq.identityId,
          audience: 'powersync-dev',
          expiresInSec: 300,
        });

        return res.json(
          responseBuilder.success({
            token,
            endpoint: config.url,
            expiresIn: 300, // 5 minutes in seconds
          }),
        );
      } catch (error) {
        logger.error('Failed to generate PowerSync token', error);
        return res.status(500).json(responseBuilder.internalError('Failed to generate sync token'));
      }
    });

    // =========================================================================
    // GET /powersync/profile-snapshot — Return manifest for the current identity
    // =========================================================================
    psRouter.get('/profile-snapshot', middleware.auth, async (req, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      const responseBuilder = createApiResponseBuilder(authenticatedReq);

      try {
        if (!authenticatedReq.identityId) {
          return res.status(401).json(responseBuilder.unauthorized('未授权，请登录'));
        }

        const snapshot = await readStoredProfileSnapshotManifest(
          config.snapshotDir,
          authenticatedReq.identityId,
        );

        if (!snapshot) {
          return res.json(
            responseBuilder.success({
              available: false,
              version: null,
              downloadUrl: null,
              checksumSha256: null,
              generatedAt: null,
            }),
          );
        }

        return res.json(
          responseBuilder.success({
            available: true,
            version: snapshot.manifest.version,
            checksumSha256: snapshot.manifest.checksumSha256,
            generatedAt: snapshot.manifest.generatedAt,
            downloadUrl: `/api/v1/powersync/profile-snapshot/download/${snapshot.snapshotKey}/${encodeURIComponent(snapshot.manifest.version)}`,
          }),
        );
      } catch (error) {
        logger.error('Failed to resolve PowerSync profile snapshot manifest', {
          error,
          identityId: authenticatedReq.identityId,
        });
        return res
          .status(500)
          .json(responseBuilder.internalError('Failed to resolve PowerSync profile snapshot'));
      }
    });

    // =========================================================================
    // GET /powersync/profile-snapshot/download/:snapshotKey/:version
    // =========================================================================
    psRouter.get(
      '/profile-snapshot/download/:snapshotKey/:version',
      middleware.auth,
      async (req, res) => {
        const authenticatedReq = req as AuthenticatedRequest;
        const responseBuilder = createApiResponseBuilder(authenticatedReq);

        try {
          if (!authenticatedReq.identityId) {
            return res.status(401).json(responseBuilder.unauthorized('未授权，请登录'));
          }

          const snapshot = await readStoredProfileSnapshotManifest(
            config.snapshotDir,
            authenticatedReq.identityId,
          );

          if (!snapshot) {
            return res.status(404).json(responseBuilder.notFound('Profile snapshot not found'));
          }

          if (
            req.params.snapshotKey !== snapshot.snapshotKey ||
            decodeURIComponent(req.params.version) !== snapshot.manifest.version
          ) {
            return res.status(404).json(responseBuilder.notFound('Profile snapshot not found'));
          }

          return res.sendFile(snapshot.databasePath, {
            headers: {
              'Content-Type': 'application/vnd.sqlite3',
              'Cache-Control': 'private, max-age=60',
              'X-PowerSync-Snapshot-Version': snapshot.manifest.version,
              'X-PowerSync-Snapshot-Checksum': snapshot.manifest.checksumSha256,
            },
          });
        } catch (error) {
          logger.error('Failed to stream PowerSync profile snapshot', {
            error,
            identityId: authenticatedReq.identityId,
          });
          return res
            .status(500)
            .json(responseBuilder.internalError('Failed to stream PowerSync profile snapshot'));
        }
      },
    );

    // =========================================================================
    // PUT /powersync/crud — Receive CRUD batches from PowerSync clients
    // =========================================================================
    // PowerSync clients call uploadData() which sends batched CRUD operations.
    // Each operation contains: { op: 'PUT'|'PATCH'|'DELETE', type: table, id, data }
    // We apply them to Postgres via Prisma inside a transaction.
    // =========================================================================
    psRouter.put('/crud', middleware.auth, async (req, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      try {
        const { transactions } = authenticatedReq.body;

        if (!transactions || !Array.isArray(transactions)) {
          return res.status(400).json({
            ok: false,
            code: 'BAD_REQUEST',
            message: 'Missing or invalid transactions array',
          });
        }

        const identityId = authenticatedReq.identityId!;
        const txCount = Array.isArray(transactions) ? transactions.length : 0;
        const opCount = transactions.reduce(
          (count: number, tx: any) => count + (tx?.ops?.length ?? tx?.crud?.length ?? 0),
          0,
        );

        logger.info('PowerSync CRUD batch received', {
          identityId,
          transactionCount: txCount,
          operationCount: opCount,
        });

        // Process all transactions
        await db.$transaction(async (tx: any) => {
          for (const transaction of transactions) {
            const ops = transaction.ops || transaction.crud || [];

            for (const op of ops) {
              const { op: opType, type: tableName, id, data } = op;
              const delegate = getPrismaDelegate(tx, tableName);

              if (!delegate) {
                logger.warn(`Unknown table in CRUD operation: ${tableName}`);
                continue;
              }

              switch (opType) {
                case 'PUT': {
                  // Upsert — create or replace
                  const record: Record<string, unknown> = { ...normalizeCrudData(tableName, data), id };
                  // Inject identity_id for user-owned tables
                  if (IDENTITY_ID_TABLES.has(tableName)) {
                    record.identityId = identityId;
                  }
                  await delegate.upsert({
                    where: { id },
                    create: record,
                    update: record,
                  });
                  break;
                }

                case 'PATCH': {
                  // Partial update — also inject identity_id to prevent
                  // clients from changing ownership of user-owned records
                  const patchData = normalizeCrudData(tableName, data);
                  if (IDENTITY_ID_TABLES.has(tableName)) {
                    patchData.identityId = identityId;
                  }
                  await delegate.update({
                    where: { id },
                    data: patchData,
                  });
                  break;
                }

                case 'DELETE': {
                  // Delete — use deleteMany to avoid throwing if record doesn't exist
                  await delegate.deleteMany({
                    where: { id },
                  });
                  break;
                }

                default:
                  logger.warn(`Unknown CRUD operation type: ${opType}`);
              }
            }
          }
        });

        return res.json({ ok: true });
      } catch (error) {
        logger.error('PowerSync CRUD processing failed', {
          error,
          identityId: authenticatedReq.identityId,
        });
        return res.status(500).json({
          ok: false,
          code: 'INTERNAL_ERROR',
          message: 'Failed to process sync operations',
        });
      }
    });

    // =========================================================================
    // GET /powersync/schema — Return the PowerSync schema for diagnostics
    // =========================================================================
    psRouter.get('/schema', (_req, res) => {
      return res.json({
        ok: true,
        data: {
          powersync_url: config.url,
          configured: !!config.privateKey,
        },
      });
    });

    // Mount under /powersync
    router.use('/powersync', psRouter);

    logger.info(
      'PowerSync routes registered: /powersync/token, /powersync/profile-snapshot, /powersync/crud, /powersync/schema',
    );
  },
};
