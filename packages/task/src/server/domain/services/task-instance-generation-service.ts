/**
 * TaskInstanceGenerationService - 任务实例生成服务
 *
 * 领域服务职责：
 * - 纯业务逻辑：计算需要生成的实例
 * - 不进行持久化
 */

import { TaskTemplate, TaskInstance } from '../aggregates';
import { TASK_INSTANCE_GENERATION_CONFIG } from '@dailyuse/contracts/task';

const { TARGET_GENERATE_AHEAD_DAYS, REFILL_THRESHOLD_DAYS } =
  TASK_INSTANCE_GENERATION_CONFIG;

export class TaskInstanceGenerationService {
  constructor() {}

  /**
   * 为指定模板生成实例（纯计算）
   *
   * @param template 任务模板
   * @param options 配置选项
   * @returns 生成的实例列表（未持久化）
   */
  generateInstances(
    template: TaskTemplate,
    options: {
      forceGenerate?: boolean;
      targetDate?: number; // 覆盖默认的 100 天
    } = {},
  ): TaskInstance[] {
    const now = Date.now();
    const { forceGenerate = false } = options;

    // 1. 计算起始日期：从上次生成日期的下一天，或从今天开始
    // 注意：如果是强制生成，调用方应该负责清理旧实例，这里只负责生成新的
    const lastGeneratedTime = template.lastGeneratedDate;
    const fromDate =
      !forceGenerate && lastGeneratedTime ? lastGeneratedTime + 86400000 : now;

    // 2. 计算目标结束日期：默认未来 100 天
    const targetDays = TARGET_GENERATE_AHEAD_DAYS;
    const toDate = options.targetDate || now + targetDays * 86400000;

    // 3. 如果起始日期已经超过目标日期，说明已经生成够了
    if (fromDate > toDate) {
      return [];
    }

    // 4. 调用聚合根方法生成实例
    return template.generateInstances(fromDate, toDate);
  }

  /**
   * 检查模板是否需要补充实例
   *
   * @param template 任务模板
   * @returns 是否需要补充
   */
  shouldRefillInstances(template: TaskTemplate): boolean {
    // 只为 Active 状态的模板补充实例
    if (template.status !== 'Active') {
      return false;
    }

    const now = Date.now();

    // 检查最远实例的日期
    const lastGenerated = template.lastGeneratedDate || 0;
    const daysRemaining = Math.floor((lastGenerated - now) / 86400000);

    // 如果剩余天数少于阈值，需要补充
    return daysRemaining < REFILL_THRESHOLD_DAYS;
  }

  /**
   * 计算补充实例的目标日期
   */
  calculateRefillTargetDate(): number {
    return Date.now() + TARGET_GENERATE_AHEAD_DAYS * 86400000;
  }
}
