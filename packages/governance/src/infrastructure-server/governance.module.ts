import type { IRuleRepository, IRuleRevisionRepository } from '../domain-server';
import {
  CreateRuleUseCase,
  UpdateRuleUseCase,
  DeleteRuleUseCase,
  GetRuleUseCase,
  ListRulesUseCase,
  GetRuleRevisionsUseCase,
} from '../application-server';
import { GovernanceContainer } from './di/governance-container';

export interface GovernanceModuleRepositories {
  readonly ruleRepository: IRuleRepository;
  readonly revisionRepository: IRuleRevisionRepository;
}

export class GovernanceModule {
  public readonly ruleRepository: IRuleRepository;
  public readonly revisionRepository: IRuleRevisionRepository;

  public readonly createRule: CreateRuleUseCase;
  public readonly updateRule: UpdateRuleUseCase;
  public readonly deleteRule: DeleteRuleUseCase;
  public readonly getRule: GetRuleUseCase;
  public readonly listRules: ListRulesUseCase;
  public readonly getRevisions: GetRuleRevisionsUseCase;

  constructor(repositories: GovernanceModuleRepositories) {
    const container = GovernanceContainer.getInstance();
    container.reset();
    container.setRuleRepository(repositories.ruleRepository);
    container.setRevisionRepository(repositories.revisionRepository);

    this.ruleRepository = container.getRuleRepository();
    this.revisionRepository = container.getRevisionRepository();

    this.createRule = new CreateRuleUseCase(this.ruleRepository);
    this.updateRule = new UpdateRuleUseCase(this.ruleRepository);
    this.deleteRule = new DeleteRuleUseCase(this.ruleRepository);
    this.getRule = new GetRuleUseCase(this.ruleRepository);
    this.listRules = new ListRulesUseCase(this.ruleRepository);
    this.getRevisions = new GetRuleRevisionsUseCase(this.revisionRepository);
  }
}
