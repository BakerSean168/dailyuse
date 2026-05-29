/**
 * Governance Module — Electron Entry Point.
 * 治理模块 — Electron 入口点。
 *
 * Self-contained governance runtime assembly for Electron main process.
 * 治理模块在 Electron 主进程中的自包含运行时组装。
 * Instantiates PowerSync repositories through the module factory,
 * and registers IPC handlers using the GovernanceController.
 * 通过模块工厂实例化 PowerSync 仓储，并使用 GovernanceController 注册 IPC 处理器。
 *
 * @module governance/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { createGovernancePowerSyncModule } from '../infrastructure-server/powersync';
import { GovernanceController } from '../controllers/governance.controller';
import { createLogger } from '@dailyuse/utils/logger';
import type { ListRulesQuery, SearchRulesQuery, GetRuleRevisionsQuery } from '../contracts';
import { createGovernanceTransportHandlers } from '../api/transport-handlers';
import type { GovernanceModuleInstance } from '../infrastructure-server';
import { withAuthenticatedValue } from './authenticated-ipc';

const logger = createLogger('GovernanceElectron');

const Ch = {
  CREATE: 'governance:rule:create',
  GET: 'governance:rule:get',
  UPDATE: 'governance:rule:update',
  DELETE: 'governance:rule:delete',
  LIST: 'governance:rule:list',
  SEARCH: 'governance:rule:search',
  REVISIONS: 'governance:rule-revision:list',
} as const;

const channels = Object.values(Ch);
let activeGovernanceModule: GovernanceModuleInstance | null = null;

export const GovernanceElectronModule: IElectronModule = {
  name: 'Governance',

  register(ctx: IElectronModuleContext): void {
    const { db } = ctx;

    // 1. Composition Root
    const governanceModule = createGovernancePowerSyncModule(db);
    activeGovernanceModule = governanceModule;
    governanceModule.start();

    // 2. Controller (Zod validation + use case orchestration)
    const controller = new GovernanceController(
      createGovernanceTransportHandlers(governanceModule.api),
    );

    // 3. IPC Handlers — Read operations (no auth context needed for queries)
    ipcMain.handle(Ch.LIST, (_event, query?: ListRulesQuery) =>
      controller.listRules({ page: query?.page ?? 1, pageSize: query?.pageSize ?? 20, ...query }),
    );

    ipcMain.handle(Ch.GET, (_event, req: { id?: string; code?: string }) => {
      if (req.id) return controller.getRuleById(req.id);
      if (req.code) return controller.getRuleByCode(req.code);
      return Promise.reject(new Error('Either id or code is required'));
    });

    ipcMain.handle(Ch.SEARCH, (_event, query: SearchRulesQuery) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.searchRules(query, requestContext),
      ),
    );

    // Write operations — require authenticated identity for audit trail
    ipcMain.handle(Ch.CREATE, (_event, req) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.createRule(req, requestContext),
      ),
    );

    ipcMain.handle(Ch.UPDATE, (_event, payload: { ruleId: string; [key: string]: unknown }) => {
      const { ruleId, ...data } = payload;
      return withAuthenticatedValue(ctx, async (requestContext) =>
        controller.updateRule(ruleId, data, requestContext),
      );
    });

    ipcMain.handle(Ch.DELETE, (_event, payload: { id: string }) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.deleteRule(payload.id, requestContext),
      ),
    );

    ipcMain.handle(Ch.REVISIONS, (_event, payload: { ruleId: string } & GetRuleRevisionsQuery) =>
      controller.getRevisions(payload.ruleId, payload),
    );

    logger.info('Governance module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    activeGovernanceModule?.dispose();
    activeGovernanceModule = null;
    logger.info('Governance module destroyed');
  },
};
