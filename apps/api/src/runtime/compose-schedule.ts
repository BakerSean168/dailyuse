/**
 * Schedule API composition root — API lane host runtime (two-phase).
 * 日程 API 组合根 —— API lane 宿主运行时（两阶段）。
 *
 * Schedule is the only remaining module that requires explicit two-phase host
 * assembly: the host must create the schedule repository set FIRST, feed its
 * `scheduleTaskRepository` into `createScheduleOrchestrationModule` (which
 * produces the `sourceExecutor`), and ONLY THEN hand the same repository set
 * plus the source executor to this composer. The composer never creates a second
 * repository set — it builds the module from the very same instances so the
 * schedule task repository (and the lease coordinator) are identical for
 * orchestration and the schedule module.
 *
 * 日程是唯一需要显式两阶段宿主装配的剩余模块：宿主必须先创建 schedule 仓储集合，
 * 把其中的 `scheduleTaskRepository` 喂给 `createScheduleOrchestrationModule`
 * （它会产出 `sourceExecutor`），然后才把同一仓储集合与 source executor 交给本
 * composer。composer 绝不创建第二套仓储集合——它用完全相同的实例装配模块，
 * 使 schedule task repository（与 lease coordinator）对编排与 schedule 模块而言
 * 是同一实例。
 *
 * Assembly order (plan §3.3) — MUST be: shared repository set → module-owned
 * scheduler runtime contribution (source executor) → schedule instance → API
 * module. The host appends its own runtime contributions after the module-owned
 * queue runtime.
 *
 * 组装顺序（计划 §3.3）必须为：共享仓储集合 → 模块自有调度器运行时贡献
 * （source executor）→ schedule instance → API module。宿主自己的运行时贡献追加
 * 在模块自有队列运行时之后。
 */

import {
  createScheduleModule,
  createScheduleRuntimeContribution,
  type ScheduleRepositorySet,
  type ScheduleRuntimeContributionsInput,
  type ScheduleModuleRuntimeContribution,
  type ScheduleTask,
  type ScheduleTaskSourceExecutor,
} from '@memoflow/schedule';
import {
  createScheduleApiModule,
  type ScheduleApiModuleDef,
} from '@memoflow/schedule/api';

/**
 * Dependencies the schedule composer needs from the API host runtime.
 * 日程 composer 需要从 API 宿主运行时拿到的依赖。
 */
export interface ComposeScheduleDependencies {
  /** The ONE two-phase schedule repository set created by the host. 宿主的唯一两阶段 schedule 仓储集合。 */
  readonly repositories: ScheduleRepositorySet;
  /** The orchestration source executor produced from the SAME repository set. 由同一仓储集合产出的编排 source executor。 */
  readonly sourceExecutor: ScheduleTaskSourceExecutor;
  /** Extra runtime contributions from the host, appended after the queue runtime. 宿主提供的额外运行时贡献，追加在队列运行时之后。 */
  readonly runtimeContributions?: ScheduleRuntimeContributionsInput;
  /** Optional predicate deciding which tasks the scheduler queue may own. 可选谓词，决定调度器队列可拥有的任务。 */
  readonly shouldScheduleTask?: (task: ScheduleTask) => boolean | Promise<boolean>;
}

/**
 * Composed schedule surface for the API host.
 * 日程在 API 宿主的组装结果。
 */
export interface ComposedSchedule {
  /** Already-bound IApiModule-compatible handle. 已绑定的 IApiModule 兼容 handle。 */
  readonly module: ScheduleApiModuleDef;
  /** The shared repository set (unchanged identity). 共享仓储集合（同一实例）。 */
  readonly repositories: ScheduleRepositorySet;
}

function normalizeRuntimeContributions(
  runtimeContributions?: ScheduleRuntimeContributionsInput,
): readonly ScheduleModuleRuntimeContribution[] {
  if (!runtimeContributions) {
    return [];
  }
  return Array.isArray(runtimeContributions)
    ? Array.from(runtimeContributions)
    : [runtimeContributions as ScheduleModuleRuntimeContribution];
}

/**
 * Composes the schedule API module handle from the shared repository set.
 * 用共享仓储集合组装日程 API module handle。
 *
 * Wire order:
 * 1. createScheduleRuntimeContribution({ scheduleTaskRepository: repositories.scheduleTaskRepository,
 *    sourceExecutor, leaseCoordinator: repositories.leaseCoordinator, shouldScheduleTask })
 *    — build the module-owned scheduler queue runtime from the SHARED task
 *    repository and the orchestration source executor.
 * 2. createScheduleModule({ ...repositories, runtimeContributions: [queueRuntime, ...host] })
 *    — assemble the transport-neutral schedule instance from the SAME repository
 *    instances (module-owned worker/publisher runtimes are prepended inside).
 * 3. createScheduleApiModule({ instance }) — bind the instance to an IApiModule
 *    handle (transport + lifecycle only).
 *
 * 接线顺序：
 * 1. createScheduleRuntimeContribution({ scheduleTaskRepository: repositories.scheduleTaskRepository,
 *    sourceExecutor, leaseCoordinator: repositories.leaseCoordinator, shouldScheduleTask })
 *    —— 用共享 task 仓储与编排 source executor 构建模块自有调度器队列运行时。
 * 2. createScheduleModule({ ...repositories, runtimeContributions: [queueRuntime, ...host] })
 *    —— 用同一仓储实例装配与传输无关的日程实例（模块自有 worker/publisher 运行时在内部前置）。
 * 3. createScheduleApiModule({ instance }) —— 把实例绑定到 IApiModule handle
 *    （只负责 transport 与生命周期）。
 *
 * The returned handle is already fully bound: ApiBootstrapper.register() must
 * be called with it once (Schedule register is async and awaited), and its
 * destroy() disposes the owned instance.
 *
 * 返回的 handle 已完全绑定：ApiBootstrapper.register() 必须恰好注册一次
 * （Schedule register 是异步的并会被 await），其 destroy() 会 dispose 所属实例。
 *
 * @param dependencies - ComposeScheduleDependencies with the shared repository set and source executor.
 * @returns ComposedSchedule — the bound module handle plus the shared repository set.
 */
export function composeSchedule(
  dependencies: ComposeScheduleDependencies,
): ComposedSchedule {
  const { repositories } = dependencies;

  const queueRuntime = createScheduleRuntimeContribution({
    scheduleTaskRepository: repositories.scheduleTaskRepository,
    sourceExecutor: dependencies.sourceExecutor,
    leaseCoordinator: repositories.leaseCoordinator,
    shouldScheduleTask: dependencies.shouldScheduleTask,
  });

  const instance = createScheduleModule({
    scheduleRepository: repositories.scheduleRepository,
    scheduleExecutionRepository: repositories.scheduleExecutionRepository,
    scheduleTaskRepository: repositories.scheduleTaskRepository,
    leaseCoordinator: repositories.leaseCoordinator,
    eventDeliveryLogConsumer: repositories.eventDeliveryLogConsumer,
    runtimeContributions: [
      queueRuntime,
      ...normalizeRuntimeContributions(dependencies.runtimeContributions),
    ],
    auditRepository: repositories.auditRepository,
  });

  return {
    module: createScheduleApiModule({ instance }),
    repositories,
  };
}
