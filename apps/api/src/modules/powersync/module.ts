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
import { createLogger } from '@dailyuse/utils';
import type { IApiModule, IApiModuleContext } from '../../shared/contracts/api-module.js';
import { getPowerSyncConfig } from '../../shared/infrastructure/config/env.js';
import type { AuthenticatedRequest } from '../../shared/infrastructure/http/middlewares/authMiddleware.js';

const logger = createLogger('PowerSync');

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
    psRouter.get('/token', middleware.auth, (req: AuthenticatedRequest, res) => {
      try {
        if (!config.privateKey) {
          logger.error('PowerSync private key not configured');
          return res.status(503).json({
            success: false,
            message: 'PowerSync sync is not configured',
          });
        }

        if (!req.identityId) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required',
          });
        }

        // Sign a short-lived RS256 JWT for PowerSync
        const token = jwt.sign(
          {
            sub: req.identityId,
            aud: 'powersync-dev',
          },
          config.privateKey,
          {
            algorithm: 'RS256',
            expiresIn: '5m', // Short-lived; client refreshes via fetchCredentials()
            keyid: config.keyId,
          } as jwt.SignOptions,
        );

        return res.json({
          success: true,
          data: {
            token,
            endpoint: config.url,
            expiresIn: 300, // 5 minutes in seconds
          },
        });
      } catch (error) {
        logger.error('Failed to generate PowerSync token', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to generate sync token',
        });
      }
    });

    // =========================================================================
    // PUT /powersync/crud — Receive CRUD batches from PowerSync clients
    // =========================================================================
    // PowerSync clients call uploadData() which sends batched CRUD operations.
    // Each operation contains: { op: 'PUT'|'PATCH'|'DELETE', type: table, id, data }
    // We apply them to Postgres via Prisma inside a transaction.
    // =========================================================================
    psRouter.put('/crud', middleware.auth, async (req: AuthenticatedRequest, res) => {
      try {
        const { transactions } = req.body;

        if (!transactions || !Array.isArray(transactions)) {
          return res.status(400).json({
            success: false,
            message: 'Missing or invalid transactions array',
          });
        }

        const identityId = req.identityId!;

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
                  const record = { ...data, id };
                  // Inject identity_id for user-owned tables
                  if ('identityId' in (delegate.fields || {})) {
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
                  // Partial update
                  await delegate.update({
                    where: { id },
                    data,
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

        return res.json({ success: true });
      } catch (error) {
        logger.error('PowerSync CRUD processing failed', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to process sync operations',
        });
      }
    });

    // =========================================================================
    // GET /powersync/schema — Return the PowerSync schema for diagnostics
    // =========================================================================
    psRouter.get('/schema', (_req, res) => {
      return res.json({
        success: true,
        data: {
          powersync_url: config.url,
          configured: !!config.privateKey,
        },
      });
    });

    // Mount under /powersync
    router.use('/powersync', psRouter);

    logger.info(
      'PowerSync routes registered: /powersync/token, /powersync/crud, /powersync/schema',
    );
  },
};
