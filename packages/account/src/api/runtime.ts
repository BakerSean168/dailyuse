import type { AccountModuleRuntimeContribution } from '../infrastructure-server';

export type AccountRuntimeContribution = AccountModuleRuntimeContribution;

/**
 * Minimal runtime helper for account transports.
 * account 当前主要跨模块副作用来自事件监听，因此 runtime 由组合根直接接收。
 */
export function createAccountRuntimeContribution(
  contribution: AccountModuleRuntimeContribution,
): AccountRuntimeContribution {
  return contribution;
}
