/**
 * 应用环境
 */
export const AppEnvironment = {
  Development: 'Development',
  Staging: 'Staging',
  Production: 'Production',
} as const;

export type AppEnvironment = (typeof AppEnvironment)[keyof typeof AppEnvironment];
