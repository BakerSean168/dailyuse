/**
 * Goal Event Handlers (Server)
 *
 * R2-5b：跨模块「任务实例 → Goal 进度贡献」已收敛为单一 durable 通道——
 * Task 侧写 TaskGoalOutbox（事务内），宿主 dispatcher 投递，Goal 侧由
 * GoalTaskProgressHandler 消费（apply / revert，GoalRecord 唯一键幂等）。
 *
 * 因此这里不再直连订阅 task 事件（原 ADR-033 范式 A 的 eventBus 直连已移除，
 * 避免与 outbox 双轨并存）；保留 `registerGoalEventListeners` 签名与
 * start/stop 契约，宿主挂载点无需改动。
 */

import { createLogger } from '@memoflow/utils/logger';
import type { IGoalRepository, IGoalRecordRepository } from '../../domain';
import type { GoalWriteTransactionRunner } from '../use-cases/commands/goal-write-support';

export {
  GoalTaskProgressHandler,
  createGoalTaskProgressHandler,
  type TaskGoalProgressHandler,
} from './task-goal-progress.handler';

const logger = createLogger('GoalEventListeners');

/**
 * Register Goal event listeners.
 *
 * 保留幂等启停契约（宿主在启动时 `start()`，关闭时 `stop()`）；
 * R2-5b 起内部不再注册 task 事件直连订阅（贡献通道已收敛到 outbox）。
 */
export function registerGoalEventListeners(
  _goalRepository: IGoalRepository,
  _goalRecordRepository: IGoalRecordRepository,
  _goalWriteTransactionRunner?: GoalWriteTransactionRunner,
): { start(): void; stop(): void } {
  let started = false;

  return {
    start(): void {
      if (started) {
        return;
      }
      started = true;
      logger.info(
        '[GoalEventListeners] No direct task subscriptions (R2-5b: Task->Goal via outbox)',
      );
    },
    stop(): void {
      started = false;
      logger.info('[GoalEventListeners] Stopped');
    },
  };
}
