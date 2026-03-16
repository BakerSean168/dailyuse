import { createGovernanceModule, type GovernanceModuleInstance } from './governance.module';
import { PowerSyncRuleRepository, PowerSyncRuleRevisionRepository } from './adapters/powersync';
import type { IElectronDatabase } from '@dailyuse/contracts/electron';

export function createGovernancePowerSyncModule(db: IElectronDatabase): GovernanceModuleInstance {
  return createGovernanceModule({
    ruleRepository: new PowerSyncRuleRepository(db),
    revisionRepository: new PowerSyncRuleRevisionRepository(db),
  });
}

export { PowerSyncRuleRepository, PowerSyncRuleRevisionRepository };
