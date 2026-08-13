/**
 * Goal event-listeners runtime factory.
 * 目标事件监听器运行时工厂。
 *
 * Package-owned runtime contribution that wraps `registerGoalEventListeners` and
 * gives hosts a reversible, idempotent `start` / `stop` seam. Host composers
 * pass the result into `createGoalModule` as a module-owned runtime contribution,
 * so no transport module needs to call `registerGoalEventListeners` directly.
 *
 * 包内自有的运行时贡献，包装 `registerGoalEventListeners`，
 * 为宿主提供可逆且幂等的 `start` / `stop` seam。
 * 宿主 composer 将结果作为模块自有运行时贡献传给 `createGoalModule`，
 * 因此无需任何传输模块直接调用 `registerGoalEventListeners`。
 *
 * The wrapped listener keeps its R2-5b no-direct-subscription semantics — durable
 * Task -> Goal progress still flows through the Task outbox and GoalTaskProgressHandler.
 * 被包装的监听器保留 R2-5b 的 no-direct-subscription 语义——可靠的 Task -> Goal
 * 进度仍然经由 Task outbox 与 GoalTaskProgressHandler 流动。
 */

import { registerGoalEventListeners } from '../../application/event-handlers';
import type { IGoalRecordRepository, IGoalRepository } from '../../domain';
import type { GoalWriteTransactionRunner } from '../../application/use-cases/commands/goal-write-support';
import type { GoalModuleRuntimeContribution } from '../goal.module';

/**
 * Runtime contribution surface for Goal event listeners.
 * 目标事件监听器的运行时贡献表面。
 *
 * Structurally identical to `GoalModuleRuntimeContribution`; declared as its own
 * type so the factory seam stays port-shaped and testable.
 * 与 `GoalModuleRuntimeContribution` 结构一致；独立声明以便工厂 seam 保持
 * Port 形状且可测试。
 */
export interface GoalEventListenersRuntime extends GoalModuleRuntimeContribution {}

/**
 * Creates a Goal event-listeners runtime contribution.
 * 创建目标事件监听器运行时贡献。
 *
 * Wraps the existing `registerGoalEventListeners` with idempotent `start` / `stop`
 * delegation. Safe to call repeatedly; starting twice or stopping an unstarted
 * runtime are no-ops.
 *
 * 包装现有 `registerGoalEventListeners`，以幂等方式委托 `start` / `stop`。
 * 可安全重复调用；重复 start 或对未启动的运行时 stop 均为 no-op。
 *
 * @param deps - The Goal repositories and transaction runner the listeners consume.
 *               监听器消费的目标仓储与事务运行器。
 * @returns A reversible Goal event-listeners runtime contribution.
 *          返回可逆的目标事件监听器运行时贡献。
 */
export function createGoalEventListenersRuntime(deps: {
  readonly goalRepository: IGoalRepository;
  readonly goalRecordRepository: IGoalRecordRepository;
  readonly goalWriteTransactionRunner: GoalWriteTransactionRunner;
}): GoalEventListenersRuntime {
  return registerGoalEventListeners(
    deps.goalRepository,
    deps.goalRecordRepository,
    deps.goalWriteTransactionRunner,
  );
}
