import { GovernanceModule, type GovernanceModuleRepositories } from './governance.module';
import { GovernanceContainer } from './di/governance-container';
import { PowerSyncRuleRepository, PowerSyncRuleRevisionRepository } from './adapters/powersync';
import type { IElectronDatabase } from '@dailyuse/contracts/electron';

export class GovernancePowerSyncModule extends GovernanceModule {
  constructor(db: IElectronDatabase) {
    const repositories: GovernanceModuleRepositories = {
      ruleRepository: new PowerSyncRuleRepository(db),
      revisionRepository: new PowerSyncRuleRevisionRepository(db),
    };
    super(repositories);
  }
}

export { PowerSyncRuleRepository, PowerSyncRuleRevisionRepository, GovernanceContainer };
