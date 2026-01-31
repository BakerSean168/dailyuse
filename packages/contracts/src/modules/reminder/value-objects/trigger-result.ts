/**
 * 触发结果
 */
export const TriggerResult = {
  Success: 'Success', // 成功
  Failed: 'Failed', // 失败
  Skipped: 'Skipped', // 跳过
} as const;

export type TriggerResult = (typeof TriggerResult)[keyof typeof TriggerResult];
