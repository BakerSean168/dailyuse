/**
 * 执行状态
 */
export const ExecutionStatus = {
  Success: 'Success', // 成功 - 执行成功完成
  Failed: 'Failed', // 失败 - 执行失败
  Skipped: 'Skipped', // 跳过 - 执行被跳过（如任务已暂停）
  Timeout: 'Timeout', // 超时 - 执行超时
  Retrying: 'Retrying', // 重试中 - 正在重试执行
} as const;

export type ExecutionStatus = (typeof ExecutionStatus)[keyof typeof ExecutionStatus];
