/**
 * IScheduleConfig Interface
 *
 * 调度器配置接口
 * 定义初始化调度器时的配置选项
 */
export interface IScheduleConfig {
  /**
   * 调度器引擎类型
   *
   * - 'bree': 使用 Bree 库（推荐，支持 Worker）
   * - 'cron': 使用 node-cron 库（轻量级）
   * - 'interval': 使用原生 setInterval（简单场景）
   */
  type: 'bree' | 'cron' | 'interval';

  /**
   * 是否自动启动调度器
   * @default false
   */
  autoStart?: boolean;

  /**
   * 日志级别
   * @default 'info'
   */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';

  /**
   * 任务执行失败时的重试次数
   * @default 0（不重试）
   */
  retryAttempts?: number;

  /**
   * 任务执行失败后的重试延迟（毫秒）
   * @default 1000
   */
  retryDelay?: number;

  /**
   * 单个任务的最大执行时间（毫秒）
   * 超时的任务会被中止
   * @default 30000（30秒）
   */
  executionTimeout?: number;

  /**
   * Bree 特定的配置选项
   * 仅当 type === 'bree' 时使用
   */
  bree?: {
    /**
     * Worker 文件的根目录
     * 设置为 false 时禁用文件系统 Worker
     */
    root?: string | false;

    /**
     * Worker 文件的默认扩展名
     * @default 'ts'
     */
    defaultExtension?: string;
  };

  /**
   * 自定义错误处理函数
   */
  onError?: (taskId: string, error: Error) => void;

  /**
   * 自定义成功回调函数
   */
  onSuccess?: (taskId: string) => void;
}
