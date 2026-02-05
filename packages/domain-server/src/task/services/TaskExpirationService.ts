/**
 * TaskExpirationService - 任务过期处理服务
 *
 * 领域服务职责：
 * - 纯业务逻辑：判断任务是否过期
 * - 标记过期状态（内存中修改）
 * - 不进行持久化
 */

import { TaskInstance } from '../aggregates';

export class TaskExpirationService {
  constructor() {}

  /**
   * 检查并标记过期的任务实例
   *
   * @param instances 待检查的任务实例列表
   * @returns 已标记为过期的实例列表（需要在应用层保存）
   */
  markExpiredInstances(instances: TaskInstance[]): TaskInstance[] {
    const expiredInstances: TaskInstance[] = [];

    for (const instance of instances) {
      // 检查是否过期且可以跳过
      if (instance.isOverdue() && instance.canSkip()) {
        instance.markExpired();
        expiredInstances.push(instance);
      }
    }

    return expiredInstances;
  }

  /**
   * 检查单个实例是否过期并标记
   *
   * @param instance 任务实例
   * @returns 是否已标记为过期
   */
  checkAndMarkExpiration(instance: TaskInstance): boolean {
    if (instance.isOverdue() && instance.canSkip()) {
      instance.markExpired();
      return true;
    }
    return false;
  }

  /**
   * 获取指定日期范围内的过期任务数量（纯计算）
   *
   * @param instances 任务实例列表
   * @returns 过期数量
   */
  countExpiredInstances(instances: TaskInstance[]): number {
    return instances.filter((i) => i.status === 'Expired').length;
  }
}
