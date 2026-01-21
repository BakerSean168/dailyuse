/**
 * ScheduleConfig Type
 *
 * 调度配置类型定义
 * 包含调度器初始化所需的所有选项
 */

export interface ScheduleConfig {
  /**
   * 调度器类型：使用哪个引擎
   */
  type: 'bree' | 'cron' | 'interval';

  /**
   * 是否自动启动
   */
  autoStart?: boolean;

  /**
   * 日志级别
   */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';

  /**
   * 任务执行失败的重试次数
   */
  retryAttempts?: number;

  /**
   * 重试延迟（毫秒）
   */
  retryDelay?: number;

  /**
   * 执行超时时间（毫秒）
   */
  executionTimeout?: number;

  /**
   * Bree 特定配置
   */
  bree?: {
    root?: string | false;
    defaultExtension?: string;
  };

  /**
   * 错误处理回调
   */
  onError?: (taskId: string, error: Error) => void;

  /**
   * 成功回调
   */
  onSuccess?: (taskId: string) => void;
}

/**
 * SchedulerOptions Type
 *
 * 调度器初始化选项
 */
export interface SchedulerOptions {
  /**
   * Bree 的根目录
   */
  root?: string | false;

  /**
   * 默认文件扩展名
   */
  defaultExtension?: string;
}
