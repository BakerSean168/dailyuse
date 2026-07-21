/**
 * Governance module Electron seam.
 * Governance 模块 Electron 公开 seam。
 *
 * Owns desktop-main registration for the governance runtime.
 * 桌面主进程中的治理运行时注册入口。
 */

import { ipcMain } from 'electron';
import { ok } from '@dailyuse/contracts/result';
import { createLogger } from '@dailyuse/utils/logger';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import {
  GovernanceChannels,
  type CreateRuleReq,
  type DeleteRuleReq,
  type GetRuleReq,
  type GetRuleRevisionsQueryInput,
  type GovernanceRpcRequest,
  type ListRulesQueryInput,
  type SearchRulesQueryInput,
} from '@dailyuse/contracts/governance';
import { GovernanceController } from '../server/transport/governance.controller';
import { createGovernancePowerSyncModule } from '../server/infrastructure/powersync';
import type { GovernanceModuleInstance } from '../server/infrastructure';
import { withAuthenticatedValue } from './authenticated-ipc';

const logger = createLogger('GovernanceElectron');
const channels = Object.values(GovernanceChannels);
let activeGovernanceModule: GovernanceModuleInstance | null = null;

export const GovernanceElectronModule: IElectronModule = {
  name: 'Governance',

  register(ctx: IElectronModuleContext): void {
    const governanceModule = createGovernancePowerSyncModule(ctx.db);
    activeGovernanceModule = governanceModule;
    governanceModule.start();

    const controller = new GovernanceController(governanceModule.api);

    ipcMain.handle(
      GovernanceChannels.RULE_LIST,
      (_event, query: ListRulesQueryInput = {}) => controller.listRules(query),
    );

    ipcMain.handle(GovernanceChannels.RULE_GET, (_event, req: GetRuleReq) => controller.getRule(req));

    ipcMain.handle(GovernanceChannels.RULE_SEARCH, (_event, query: SearchRulesQueryInput) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.searchRules(query, requestContext),
      ),
    );

    ipcMain.handle(GovernanceChannels.RULE_CREATE, (_event, req: CreateRuleReq) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.createRule(req, requestContext),
      ),
    );

    ipcMain.handle(
      GovernanceChannels.RULE_UPDATE,
      (_event, payload: GovernanceRpcRequest<typeof GovernanceChannels.RULE_UPDATE>) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          controller.updateRule(payload, requestContext),
        ),
    );

    ipcMain.handle(GovernanceChannels.RULE_DELETE, (_event, payload: DeleteRuleReq) =>
      withAuthenticatedValue(ctx, async (requestContext) => {
        const result = await controller.deleteRule(payload, requestContext);
        if (!result.ok) return result;
        return ok(null);
      }),
    );

    ipcMain.handle(
      GovernanceChannels.RULE_REVISIONS,
      (_event, payload: GetRuleRevisionsQueryInput) => controller.getRevisions(payload),
    );

    logger.info('Governance module registered');
  },

  destroy(): void {
    for (const channel of channels) {
      ipcMain.removeHandler(channel);
    }
    activeGovernanceModule?.dispose();
    activeGovernanceModule = null;
    logger.info('Governance module destroyed');
  },
};