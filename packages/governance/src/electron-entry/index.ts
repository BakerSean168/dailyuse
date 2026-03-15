/**
 * Governance Module — Electron Entry Point.
 * 治理模块 — Electron 入口点。
 *
 * Self-contained Composition Root for the Governance module in Electron main process.
 * 治理模块在 Electron 主进程中的自包含组合根。
 * Instantiates PowerSync repositories, wires through GovernanceModule,
 * and registers IPC handlers using the GovernanceController.
 * 实例化 PowerSync 仓储，通过 GovernanceModule 连接，并使用 GovernanceController 注册 IPC 处理器。
 *
 * @module governance/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { GovernancePowerSyncModule, GovernanceContainer } from '../infrastructure-server/powersync';
import { GovernanceController } from '../controllers/governance.controller';
import type { GovernanceUseCases } from '../controllers/governance.controller';
import { createLogger } from '@dailyuse/utils';
import type { Context } from '@dailyuse/contracts/shared';
import type { ListRulesQuery, SearchRulesQuery, GetRuleRevisionsQuery } from '../contracts';

const logger = createLogger('GovernanceElectron');

const Ch = {
  CREATE: 'governance:rule:create',
  GET: 'governance:rule:get',
  UPDATE: 'governance:rule:update',
  DELETE: 'governance:rule:delete',
  LIST: 'governance:rule:list',
  SEARCH: 'governance:rule:search',
  REVISIONS: 'governance:rule:revisions',
} as const;

const channels = Object.values(Ch);

export const GovernanceElectronModule: IElectronModule = {
  name: 'Governance',

  register(ctx: IElectronModuleContext): void {
    const { db } = ctx;

    // 1. Composition Root
    const governanceModule = new GovernancePowerSyncModule(db);

    // 2. Controller (Zod validation + use case orchestration)
    const useCases: GovernanceUseCases = {
      createRule: (req, cx) => governanceModule.createRule.execute(req, cx),
      updateRule: (id, req, cx) => governanceModule.updateRule.execute(id, req, cx),
      deleteRule: (req, cx) => governanceModule.deleteRule.execute(req, cx),
      getRule: (req) => governanceModule.getRule.execute(req),
      listRules: (query) => governanceModule.listRules.execute(query),
      searchRules: (req, cx) => governanceModule.searchRules.execute(req, cx),
      getRevisions: (query) => governanceModule.getRevisions.execute(query),
    };

    const controller = new GovernanceController(useCases);

    // 3. IPC Handlers
    const electronContext: Context = { identityId: 'desktop-user', deviceId: 'electron-app' };

    ipcMain.handle(Ch.LIST, (_event, query?: ListRulesQuery) =>
      controller.listRules({ page: query?.page ?? 1, pageSize: query?.pageSize ?? 20, ...query }),
    );

    ipcMain.handle(Ch.GET, (_event, req: { id?: string; code?: string }) => {
      if (req.id) return controller.getRuleById(req.id);
      if (req.code) return controller.getRuleByCode(req.code);
      return Promise.reject(new Error('Either id or code is required'));
    });

    ipcMain.handle(Ch.SEARCH, (_event, query: SearchRulesQuery) =>
      controller.searchRules(query, electronContext),
    );

    ipcMain.handle(Ch.CREATE, (_event, req) => controller.createRule(req, electronContext));

    ipcMain.handle(Ch.UPDATE, (_event, payload: { ruleId: string; [key: string]: unknown }) => {
      const { ruleId, ...data } = payload;
      return controller.updateRule(ruleId, data, electronContext);
    });

    ipcMain.handle(Ch.DELETE, (_event, payload: { id: string }) =>
      controller.deleteRule(payload.id, electronContext),
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
    GovernanceContainer.getInstance().reset();
    logger.info('Governance module destroyed');
  },
};
