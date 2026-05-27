/**
 * @file PowerSync API Module
 * @description Provides authentication and CRUD endpoints for PowerSync sync service.
 *
 * This module is registered directly in the API bootstrapper (not in a domain package)
 * because it's infrastructure-level, not a domain concern.
 *
 * Route handlers are thin shells — business logic lives in:
 * - token-issuer.ts — RS256 JWT signing
 * - crud-executor.ts — CRUD batch processing
 * - snapshot-storage.ts — profile snapshot file I/O
 */

import { Router } from 'express';
import { ResultCode } from '@dailyuse/contracts/result';
import { createLogger } from '@dailyuse/utils/logger';
import type { IApiModule, IApiModuleContext } from '../../shared/contracts/api-module.js';
import { getPowerSyncConfig } from '../../shared/infrastructure/config/env.js';
import type { AuthenticatedRequest } from '../../shared/infrastructure/http/middlewares/auth-middleware.js';
import { createApiResponseBuilder } from '../../shared/infrastructure/http/response-builder.js';
import { readStoredProfileSnapshotManifest } from './snapshot-storage.js';
import { issuePowerSyncToken } from './token-issuer.js';
import { executeCrudBatch } from './crud-executor.js';

const logger = createLogger('PowerSync');

export const PowerSyncApiModule: IApiModule = {
  name: 'PowerSync',

  register(context: IApiModuleContext) {
    const { router, db, middleware } = context;
    const psRouter = Router();
    const config = getPowerSyncConfig();

    // ── GET /powersync/token ──
    psRouter.get('/token', middleware.auth, (req, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      const responseBuilder = createApiResponseBuilder(authenticatedReq);

      try {
        if (!authenticatedReq.identityId) {
          return res.status(401).json(responseBuilder.unauthorized('未授权，请登录'));
        }

        const result = issuePowerSyncToken(authenticatedReq.identityId, config);
        if (!result) {
          return res
            .status(503)
            .json(responseBuilder.error(ResultCode.SERVICE_UNAVAILABLE, 'PowerSync sync is not configured'));
        }

        return res.json(responseBuilder.success(result));
      } catch (error) {
        logger.error('Failed to issue PowerSync token', {
          error,
          identityId: authenticatedReq.identityId,
        });
        return res
          .status(500)
          .json(responseBuilder.internalError('Failed to issue PowerSync token'));
      }
    });

    // ── GET /powersync/profile-snapshot ──
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

    // ── GET /powersync/profile-snapshot/download/:snapshotKey/:version ──
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

    // ── PUT /powersync/crud ──
    psRouter.put('/crud', middleware.auth, async (req, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      const responseBuilder = createApiResponseBuilder(authenticatedReq);

      try {
        if (!authenticatedReq.identityId) {
          return res.status(401).json(responseBuilder.unauthorized('未授权，请登录'));
        }

        const { transactions } = authenticatedReq.body;

        if (!transactions || !Array.isArray(transactions)) {
          return res.status(400).json(responseBuilder.badRequest('Missing or invalid transactions array'));
        }

        const result = await executeCrudBatch(db, authenticatedReq.identityId, transactions);
        return res.json(responseBuilder.success(result));
      } catch (error) {
        logger.error('PowerSync CRUD processing failed', {
          error,
          identityId: authenticatedReq.identityId,
        });
        return res.status(500).json(responseBuilder.internalError('Failed to process sync operations'));
      }
    });

    // ── GET /powersync/schema ──
    psRouter.get('/schema', (_req, res) => {
      return res.json({
        ok: true,
        data: {
          powersync_url: config.url,
          configured: !!config.privateKey,
        },
      });
    });

    router.use('/powersync', psRouter);
    logger.info('PowerSync routes registered');
  },
};
