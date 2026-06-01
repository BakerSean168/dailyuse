/**
 * createGovernanceModule — explicit composition root for the governance server runtime.
 * createGovernanceModule —— 治理模块服务端运行时的显式组合根。
 *
 * The outer app selects concrete adapters and passes them in here.
 * This module then assembles the application layer exactly once and exposes a
 * stable facade to HTTP / IPC transports.
 *
 * 外层应用负责选择具体适配器并传入这里。
 * 组合根只做一次组装，然后向 HTTP / IPC 等传输层暴露稳定门面。
 *
 * Governance uses this file as the package's "living documentation" example for
 * the target monorepo pattern: one composition root per module, constructor
 * injection only, no hidden service locator.
 */

import type { IRuleRepository, IRuleRevisionRepository } from '../domain-server';
import {
  CreateRuleUseCase,
  UpdateRuleUseCase,
  DeleteRuleUseCase,
  GetRuleUseCase,
  ListRulesUseCase,
  SearchRulesUseCase,
  GetRuleRevisionsUseCase,
  type ExecutionContext,
} from '../application-server';
import type {
  CreateRuleReq,
  CreateRuleRes,
  DeleteRuleReq,
  DeleteRuleRes,
  GetRuleReq,
  GetRuleRes,
  GetRuleRevisionsQuery,
  GetRuleRevisionsRes,
  ListRulesQuery,
  ListRulesRes,
  SearchRulesQueryInput,
  SearchRulesRes,
  UpdateRuleReq,
  UpdateRuleRes,
} from '../contracts';
import type { Result } from '@dailyuse/contracts/result';

/**
 * Everything the governance server runtime needs from the outside world.
 * 治理模块服务端运行时向外部索取的全部依赖。
 *
 * Refactor rule for other modules:
 * - only put ports or runtime contributions here
 * - never put transport objects (Express req/res, ipcMain, Router) here
 * - never hide these dependencies behind a singleton container
 */
export type GovernanceRuntimeContributionsInput =
  | GovernanceModuleRuntimeContribution
  | readonly GovernanceModuleRuntimeContribution[];

export interface GovernanceModuleDependencies {
  readonly ruleRepository: IRuleRepository;
  readonly revisionRepository: IRuleRevisionRepository;
  readonly runtimeContributions?: GovernanceRuntimeContributionsInput;
}

/**
 * Module-owned runtime side effects.
 * 模块拥有的运行时副作用。
 *
 * A contribution is the unit we start/stop together with the module instance.
 * This is the replacement for older global initialization hooks.
 */
export interface GovernanceModuleRuntimeContribution {
  start(): void;
  stop(): void;
}

/**
 * Lower-level assembled use cases.
 * 已完成接线的底层 use case 集合。
 *
 * We keep this type because tests and low-level assembly sometimes need direct
 * access to use-case objects, but transports should prefer `GovernanceApplicationPort`.
 */
export interface GovernanceModuleUseCases {
  readonly createRule: CreateRuleUseCase;
  readonly updateRule: UpdateRuleUseCase;
  readonly deleteRule: DeleteRuleUseCase;
  readonly getRule: GetRuleUseCase;
  readonly listRules: ListRulesUseCase;
  readonly searchRules: SearchRulesUseCase;
  readonly getRevisions: GetRuleRevisionsUseCase;
}

/** Transport-neutral callable application surface. 传输层无关的可调用应用层门面。 */
export interface GovernanceApplicationPort {
  createRule(req: CreateRuleReq, cx: ExecutionContext): Promise<Result<CreateRuleRes>>;
  updateRule(
    ruleId: string,
    req: UpdateRuleReq,
    cx: ExecutionContext,
  ): Promise<Result<UpdateRuleRes>>;
  deleteRule(req: DeleteRuleReq, cx: ExecutionContext): Promise<Result<DeleteRuleRes>>;
  getRule(req: GetRuleReq): Promise<Result<GetRuleRes>>;
  listRules(query: ListRulesQuery): Promise<Result<ListRulesRes>>;
  searchRules(query: SearchRulesQueryInput, cx?: ExecutionContext): Promise<Result<SearchRulesRes>>;
  getRevisions(query: GetRuleRevisionsQuery): Promise<Result<GetRuleRevisionsRes>>;
}

/**
 * Primary governance composition root return type.
 * 治理模块主组合根返回类型。
 *
 * `api` is the transport-facing surface.
 * `useCases` is kept for low-level tests and diagnostics.
 * `start` / `dispose` own runtime side effects.
 */
export interface GovernanceModuleInstance {
  readonly ruleRepository: IRuleRepository;
  readonly revisionRepository: IRuleRevisionRepository;
  readonly useCases: GovernanceModuleUseCases;
  readonly api: GovernanceApplicationPort;
  start(): void;
  dispose(): void;
}

/**
 * Pure assembly helper used by the class facade and tests.
 * 纯组装函数：给定依赖对象，返回已经接好线的 use case 集合。
 */
/**
 * Pure assembly helper used by the class facade and tests.
 * 纯组装函数：给定依赖对象，返回已经接好线的 use case 集合。
 *
 * @param dependencies - GovernanceModuleDependencies (ports and runtime contributions)
 * @returns GovernanceModuleUseCases - assembled use-case instances
 */
export function createGovernanceUseCases(
  dependencies: GovernanceModuleDependencies,
): GovernanceModuleUseCases {
  const { ruleRepository, revisionRepository } = dependencies;

  return {
    createRule: new CreateRuleUseCase(ruleRepository, revisionRepository),
    updateRule: new UpdateRuleUseCase(ruleRepository, revisionRepository),
    deleteRule: new DeleteRuleUseCase(ruleRepository),
    getRule: new GetRuleUseCase(ruleRepository),
    listRules: new ListRulesUseCase(ruleRepository),
    searchRules: new SearchRulesUseCase(ruleRepository),
    getRevisions: new GetRuleRevisionsUseCase(revisionRepository),
  };
}

function normalizeRuntimeContributions(
  runtimeContributions?:
    | GovernanceModuleRuntimeContribution
    | ReadonlyArray<GovernanceModuleRuntimeContribution>,
): readonly GovernanceModuleRuntimeContribution[] {
  if (!runtimeContributions) {
    return [];
  }

  if (Array.isArray(runtimeContributions)) {
    return Array.from(runtimeContributions);
  }

  return [runtimeContributions as GovernanceModuleRuntimeContribution];
}

/**
 * Canonical composition root.
 * 规范化的治理模块主组合根。
 *
 * This is the file other modules should copy first when migrating away from a
 * container-based assembly. The expected reading order is:
 * 1. define `Dependencies`
 * 2. define transport-neutral `ApplicationPort`
 * 3. assemble use cases once
 * 4. wrap them in `api`
 * 5. let the module instance own `start` / `dispose`
 */
/**
 * Canonical composition root.
 * 规范化的治理模块主组合根。
 *
 * @param dependencies - GovernanceModuleDependencies describing ports and runtime contributions
 * @returns GovernanceModuleInstance - assembled module instance with api/useCases and lifecycle
 */
export function createGovernanceModule(
  dependencies: GovernanceModuleDependencies,
): GovernanceModuleInstance {
  const { ruleRepository, revisionRepository } = dependencies;
  const runtimeContributions = normalizeRuntimeContributions(dependencies.runtimeContributions);
  const useCases = createGovernanceUseCases({ ruleRepository, revisionRepository });
  let started = false;

  const api: GovernanceApplicationPort = {
    createRule: (req, cx) => useCases.createRule.execute(req, cx),
    updateRule: (ruleId, req, cx) => useCases.updateRule.execute(ruleId, req, cx),
    deleteRule: (req, cx) => useCases.deleteRule.execute(req, cx),
    getRule: (req) => useCases.getRule.execute(req),
    listRules: (query) => useCases.listRules.execute(query),
    searchRules: (query, cx) => useCases.searchRules.execute(query, cx),
    getRevisions: (query) => useCases.getRevisions.execute(query),
  };

  return {
    ruleRepository,
    revisionRepository,
    useCases,
    api,
    start(): void {
      if (started) {
        return;
      }

      for (const runtime of runtimeContributions) {
        runtime.start();
      }

      started = true;
    },
    dispose(): void {
      if (!started) {
        return;
      }

      for (const runtime of [...runtimeContributions].reverse()) {
        runtime.stop();
      }

      started = false;
    },
  };
}
