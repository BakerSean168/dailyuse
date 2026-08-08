/**
 * R7：Goal 模块的 code-owned ModuleManifest（试点）。
 * 宿主（apps/api）扫描注册，替代中央 switch 的增量入口。
 */

import type { ModuleManifest } from '@memoflow/contracts/shared';
import type { CreateGoalUseCase } from '../application/use-cases/commands/create-goal.use-case';
import type { CreateRelationUseCase } from '../application/use-cases/commands/relation.use-cases';
import type {
  CreateWalletAccountUseCase,
  RecordWalletTransactionUseCase,
} from '../application/use-cases/commands/wallet.use-cases';

export interface GoalManifestDeps {
  createGoal: CreateGoalUseCase;
  createRelation: CreateRelationUseCase;
  wallet: {
    createAccount: CreateWalletAccountUseCase;
    recordTransaction: RecordWalletTransactionUseCase;
  };
}

export function createGoalModuleManifest(deps: GoalManifestDeps): ModuleManifest {
  return {
    module: 'goal',
    commands: [
      {
        name: 'goal.create',
        module: 'goal',
        execute: (identityId, payload) =>
          deps.createGoal.execute(
            payload as never,
            { identityId } as import('@memoflow/contracts/shared').ExecutionContext,
          ),
      },
      {
        name: 'relation.create',
        module: 'goal',
        execute: (identityId, payload) =>
          deps.createRelation.execute(identityId, payload as never),
      },
      {
        name: 'wallet.account.create',
        module: 'wallet',
        execute: (identityId, payload) =>
          deps.wallet.createAccount.execute(identityId, payload as never),
      },
      {
        name: 'wallet.transaction.record',
        module: 'wallet',
        execute: (identityId, payload) =>
          deps.wallet.recordTransaction.execute(identityId, payload as never),
      },
    ],
    relations: {
      subjectTypes: ['note', 'goal', 'task', 'reminder', 'habit', 'wallet'],
      relationTypes: ['references', 'related', 'depends_on', 'contributes_to'],
      module: 'goal',
    },
    activities: {
      events: [
        { event: 'goal:created', action: 'created' },
        { event: 'goal:completed', action: 'completed' },
        { event: 'goal:review-added', action: 'review-added' },
      ],
      module: 'goal',
    },
  };
}
