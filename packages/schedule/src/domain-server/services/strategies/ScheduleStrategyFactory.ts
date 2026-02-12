/**
 * 调度策略工厂
 * 
 * 职责：
 * - 根据源模块选择合适的调度策略
 * - 管理所有策略实例
 * - 提供统一的策略访问接口
 */

import { SourceModule } from '@dailyuse/contracts/schedule';
import type { IScheduleStrategy } from './IScheduleStrategy';
import { GoalScheduleStrategy } from './GoalScheduleStrategy';
import { TaskScheduleStrategy } from './TaskScheduleStrategy';
import { ReminderScheduleStrategy } from './ReminderScheduleStrategy';

/**
 * 调度策略工厂
 */
export class ScheduleStrategyFactory {
  private static instance: ScheduleStrategyFactory;
  private strategies: Map<SourceModule, IScheduleStrategy>;

  private constructor() {
    this.strategies = new Map();
    this.registerDefaultStrategies();
  }

  /**
   * 获取工厂单例
   */
  public static getInstance(): ScheduleStrategyFactory {
    if (!ScheduleStrategyFactory.instance) {
      ScheduleStrategyFactory.instance = new ScheduleStrategyFactory();
    }
    return ScheduleStrategyFactory.instance;
  }

  /**
   * 注册默认策略
   */
  private registerDefaultStrategies(): void {
    // 注册 Goal 策略
    const goalStrategy = new GoalScheduleStrategy();
    this.strategies.set(SourceModule.Goal, goalStrategy);

    // 注册 Task 策略
    const taskStrategy = new TaskScheduleStrategy();
    this.strategies.set(SourceModule.Task, taskStrategy);

    // 注册 Reminder 策略
    const reminderStrategy = new ReminderScheduleStrategy();
    this.strategies.set(SourceModule.Reminder, reminderStrategy);
  }

  /**
   * 获取指定模块的策略
   */
  public getStrategy(sourceModule: SourceModule): IScheduleStrategy | null {
    return this.strategies.get(sourceModule) || null;
  }

  /**
   * 判断是否支持该源模块
   */
  public supports(sourceModule: SourceModule): boolean {
    return this.strategies.has(sourceModule);
  }

  /**
   * 获取所有支持的模块列表
   */
  public getSupportedModules(): SourceModule[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * 注册自定义策略（用于测试或扩展）
   */
  public registerStrategy(sourceModule: SourceModule, strategy: IScheduleStrategy): void {
    this.strategies.set(sourceModule, strategy);
  }

  /**
   * 重置工厂（主要用于测试）
   */
  public static reset(): void {
    if (ScheduleStrategyFactory.instance) {
      ScheduleStrategyFactory.instance.strategies.clear();
      ScheduleStrategyFactory.instance.registerDefaultStrategies();
    }
  }
}
