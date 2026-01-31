/**
 * 控制模式
 */
export const ControlMode = {
  Group: 'Group', // 组控制 - 所有模板统一控制
  Individual: 'Individual', // 个体控制 - 每个模板独立控制
} as const;

export type ControlMode = (typeof ControlMode)[keyof typeof ControlMode];
