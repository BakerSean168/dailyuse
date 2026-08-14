/**
 * Schedule Electron composition root — desktop lane host runtime (two-phase).
 * 日程 Electron 组合根 —— desktop lane 宿主运行时（两阶段）。
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
 * Desktop deliberately delays the schedule runtime start until the main window
 * is ready. This composer therefore returns a bound runtime controller (the
 * SAME object as the Electron module handle's `runtime`) that is the ONLY
 * schedule start/stop owner in the desktop lane — replacing the retired
 * schedule runtime package globals. Lifecycle owners (WindowManager /
 * DesktopProfileRuntimeManager) drive it through the structural
 * `ScheduleRuntimeController` type.
 *
 * 桌面 lane 刻意把 schedule runtime 启动延迟到主窗口就绪。因此本 composer 返回一个
 * 绑定的 runtime controller（与 Electron module handle 的 `runtime` 是同一对象），
 * 它是桌面 lane 中 schedule 启停的唯一所有者——取代已退役的 schedule runtime 包级
 * 全局。生命周期所有者（WindowManager / DesktopProfileRuntimeManager）通过结构化的
 * `ScheduleRuntimeController` 类型驱动它。
 *
 * Assembly order (plan §3.3) — MUST be: shared repository set → module-owned
 * scheduler runtime contribution (source executor + lease coordinator +
 * shouldScheduleTask) → schedule instance → Electron module. The host appends
 * its own runtime contributions after the module-owned queue runtime.
 *
 * 组装顺序（计划 §3.3）必须为：共享仓储集合 → 模块自有调度器运行时贡献
 * （source executor + lease coordinator + shouldScheduleTask）→ schedule instance →
 * Electron module。宿主自己的运行时贡献追加在模块自有队列运行时之后。
 */

import {
  createScheduleModule,
  createScheduleRuntimeContribution,
  type IScheduleRepository,
  type IScheduleTaskRepository,
  type ScheduleModuleRuntimeContribution,
  type ScheduleRepositorySet,
  type ScheduleRuntimeContributionsInput,
  type ScheduleTask,
  type ScheduleTaskSourceExecutor,
} from '@memoflow/schedule';
import {
  createScheduleElectronModule,
  type ScheduleElectronModuleDef,
} from '@memoflow/schedule/electron';

/**
 * Structural schedule runtime controller consumed by desktop lifecycle owners.
 * desktop 生命周期所有者消费的结构化 schedule runtime controller。
 *
 * This is the ONLY way the schedule runtime is started/stopped in the desktop
 * lane; profile deactivation stops the same instance that a profile's module
 * handle owns. Both methods are idempotent.
 *
 * 这是桌面 lane 启动/停止 schedule runtime 的唯一途径；profile 停用会停止同一
 * profile 的 module handle 所持有的同一实例。两个方法均幂等。
 */
export interface ScheduleRuntimeController {
  readonly start: () => Promise<void>;
  readonly stop: () => Promise<void>;
}

/**
 * Dependencies the schedule composer needs from the desktop host runtime.
 * 日程 composer 需要从 desktop 宿主运行时拿到的依赖。
 */
export interface ComposeScheduleDesktopDependencies {
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
 * Composed schedule surface for the desktop host.
 * 日程在 desktop 宿主的组装结果。
 */
export interface ComposedScheduleElectron {
  /** Already-bound IElectronModule-compatible handle. 已绑定的 IElectronModule 兼容 handle。 */
  readonly module: ScheduleElectronModuleDef;
  /** Instance-bound repository view for desktop consumers (dashboard). 供 desktop 消费者（dashboard）使用的 instance-bound 仓储视图。 */
  readonly repositories: {
    readonly scheduleRepository: IScheduleRepository;
    readonly scheduleTaskRepository: IScheduleTaskRepository;
  };
  /** Bound schedule runtime controller (the module handle's own `runtime`). 绑定的 schedule runtime controller（即 module handle 自身的 `runtime`）。 */
  readonly runtimeController: ScheduleRuntimeController;
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
 * Composes the schedule Electron module handle from the shared repository set.
 * 用共享仓储集合组装日程 Electron module handle。
 *
 * Wire order:
 * 1. createScheduleRuntimeContribution({ scheduleTaskRepository: repositories.scheduleTaskRepository,
 *    sourceExecutor, leaseCoordinator: repositories.leaseCoordinator, shouldScheduleTask })
 *    — build the module-owned scheduler queue runtime from the SHARED task
 *    repository and the orchestration source executor.
 * 2. createScheduleModule({ ...repositories, runtimeContributions: [queueRuntime, ...host] })
 *    — assemble the transport-neutral schedule instance from the SAME repository
 *    instances (module-owned worker/publisher runtimes are prepended inside).
 * 3. createScheduleElectronModule({ instance }) — bind the instance to an
 *    IElectronModule handle (transport + lifecycle only).
 * 4. Return the module handle's own `runtime` as the sole runtime controller.
 *
 * 接线顺序：
 * 1. createScheduleRuntimeContribution({ scheduleTaskRepository: repositories.scheduleTaskRepository,
 *    sourceExecutor, leaseCoordinator: repositories.leaseCoordinator, shouldScheduleTask })
 *    —— 用共享 task 仓储与编排 source executor 构建模块自有调度器队列运行时。
 * 2. createScheduleModule({ ...repositories, runtimeContributions: [queueRuntime, ...host] })
 *    —— 用同一仓储实例装配与传输无关的日程实例（模块自有 worker/publisher 运行时在内部前置）。
 * 3. createScheduleElectronModule({ instance }) —— 把实例绑定到 IElectronModule handle
 *    （只负责 transport 与生命周期）。
 * 4. 返回 module handle 自身的 `runtime` 作为唯一 runtime controller。
 *
 * The returned handle is already fully bound: ElectronBootstrapper.register()
 * must be called with it once (Schedule register is async and awaited), and its
 * destroy() disposes the owned instance.
 *
 * 返回的 handle 已完全绑定：ElectronBootstrapper.register() 必须恰好注册一次
 * （Schedule register 是异步的并会被 await），其 destroy() 会 dispose 所属实例。
 *
 * @param dependencies - ComposeScheduleDesktopDependencies with the shared repository set and source executor.
 * @returns ComposedScheduleElectron — the bound module handle plus the runtime controller.
 */
export function composeSchedule(
  dependencies: ComposeScheduleDesktopDependencies,
): ComposedScheduleElectron {
  const { repositories } = dependencies;

  const queueRuntime = createScheduleRuntimeContribution({
    scheduleTaskRepository: repositories.scheduleTaskRepository,
    sourceExecutor: dependencies.sourceExecutor,
    leaseCoordinator: repositories.leaseCoordinator,
    shouldScheduleTask: dependencies.shouldScheduleTask,
  });

  // Delivery-log consumer is intentionally NOT wired in the desktop lane.
  // `eventDeliveryLogConsumer` is a Prisma-only module-owned runtime produced by
  // `createSchedulePrismaRepositories` (the API lane) — it consumes
  // `ScheduleEventDeliveryLog` via a Prisma `$transaction`. The desktop
  // PowerSync lane has no such DB composition root, and merge-base
  // (ec0a7f965) never wired it here; see plan §3.5 residual #5. Wiring it on
  // desktop would require a Prisma transaction seam that does not exist in the
  // offline-first lane.
  //
  // delivery-log consumer 刻意不接桌面 lane。`eventDeliveryLogConsumer` 是仅
  // Prisma 的模块自有运行时，由 `createSchedulePrismaRepositories`（API lane）
  // 生产——它通过 Prisma `$transaction` 消费 `ScheduleEventDeliveryLog`。
  // desktop PowerSync lane 没有这样的 DB 组合根，且 merge-base（ec0a7f965）
  // 从未在此接线；见计划 §3.5 残余 #5。在 desktop 接线需要一条离线优先 lane
  // 中不存在的 Prisma 事务 seam。
  const instance = createScheduleModule({
    scheduleRepository: repositories.scheduleRepository,
    scheduleExecutionRepository: repositories.scheduleExecutionRepository,
    scheduleTaskRepository: repositories.scheduleTaskRepository,
    leaseCoordinator: repositories.leaseCoordinator,
    runtimeContributions: [
      queueRuntime,
      ...normalizeRuntimeContributions(dependencies.runtimeContributions),
    ],
    auditRepository: repositories.auditRepository,
  });

  const module = createScheduleElectronModule({ instance });

  return {
    module,
    repositories: {
      scheduleRepository: repositories.scheduleRepository,
      scheduleTaskRepository: repositories.scheduleTaskRepository,
    },
    runtimeController: module.runtime,
  };
}
