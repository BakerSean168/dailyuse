import type { IRuleRepository, IRuleRevisionRepository } from '../../domain-server';

export class GovernanceContainer {
  private static instance: GovernanceContainer;
  private ruleRepository?: IRuleRepository;
  private revisionRepository?: IRuleRevisionRepository;

  private constructor() {}

  static getInstance(): GovernanceContainer {
    if (!GovernanceContainer.instance) {
      GovernanceContainer.instance = new GovernanceContainer();
    }
    return GovernanceContainer.instance;
  }

  setRuleRepository(repository: IRuleRepository): void {
    this.ruleRepository = repository;
  }

  setRevisionRepository(repository: IRuleRevisionRepository): void {
    this.revisionRepository = repository;
  }

  getRuleRepository(): IRuleRepository {
    if (!this.ruleRepository) {
      throw new Error('RuleRepository not registered in GovernanceContainer');
    }
    return this.ruleRepository;
  }

  getRevisionRepository(): IRuleRevisionRepository {
    if (!this.revisionRepository) {
      throw new Error('RuleRevisionRepository not registered in GovernanceContainer');
    }
    return this.revisionRepository;
  }

  reset(): void {
    this.ruleRepository = undefined;
    this.revisionRepository = undefined;
  }
}
