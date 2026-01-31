/**
 * 操作者类型
 */
export const OperatorType = {
  User: 'User',
  System: 'System',
  Api: 'Api',
} as const;

export type OperatorType = (typeof OperatorType)[keyof typeof OperatorType];
