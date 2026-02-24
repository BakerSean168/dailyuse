/**
 * Governance Module — Electron Entry Point
 *
 * Self-contained Composition Root for the Governance module in Electron main process.
 * Instantiates SQLite repositories, wires through GovernanceModule,
 * and registers IPC handlers using the GovernanceController.
 *
 * @module governance/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import {
  RuleSqliteRepository,
  RuleRevisionSqliteRepository,
  GovernanceModule,
  GovernanceContainer,
} from '../infrastructure-server';
import { GovernanceController } from '../controllers/governance.controller';
import type { GovernanceUseCases } from '../controllers/governance.controller';
import { ok } from '@dailyuse/contracts/result';
import { createLogger } from '@dailyuse/utils';
import type { Context } from '@dailyuse/contracts/shared';
import type {
  ListRulesQuery,
  SearchRulesQuery,
  GetRuleRevisionsQuery,
} from '../contracts';

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

    // 1. Repositories
    const ruleRepository = new RuleSqliteRepository(db);
    const revisionRepository = new RuleRevisionSqliteRepository(db);

    // 2. Composition Root
    const governanceModule = new GovernanceModule({
      ruleRepository,
      revisionRepository,
    });

    // 3. Controller (Zod validation + use case orchestration)
    const useCases: GovernanceUseCases = {
      createRule: (req, cx) => governanceModule.createRule.execute(req, cx),
      updateRule: (id, req, cx) => governanceModule.updateRule.execute(id, req, cx),
      deleteRule: (req, cx) => governanceModule.deleteRule.execute(req, cx),
      getRule: (req) => governanceModule.getRule.execute(req),
      listRules: (query) => governanceModule.listRules.execute(query),
      searchRules: (query, filters, cx) => governanceModule.searchRules.execute(query, filters, cx),
      getRevisions: (query) => governanceModule.getRevisions.execute(query),
    };

    const controller = new GovernanceController(useCases);

    // 4. IPC Handlers
    const electronContext: Context = { identityId: 'desktop-user', deviceId: 'electron-app' };

    ipcMain.handle(Ch.LIST, (_event, query?: ListRulesQuery) =>
      controller.listRules({ page: 1, pageSize: 20, ...query }),
    );

    ipcMain.handle(Ch.GET, (_event, req: { id?: string; code?: string }) =>
      controller.getRuleById(req.id ?? req.code ?? ''),
    );

    ipcMain.handle(Ch.SEARCH, (_event, query: SearchRulesQuery) =>
      controller.searchRules(query, electronContext),
    );

    ipcMain.handle(Ch.CREATE, (_event, req) =>
      controller.createRule(req, electronContext),
    );

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
