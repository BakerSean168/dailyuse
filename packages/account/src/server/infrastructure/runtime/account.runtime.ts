import type { IAccountRepository } from '../../domain';
import { createAccountEventListenerRuntime } from '../../application/handlers';
import type { AccountModuleRuntimeContribution } from '../account.module';

export type AccountRuntimeContribution = AccountModuleRuntimeContribution;
export type AccountRuntimeContributionsInput =
  | AccountRuntimeContribution
  | readonly AccountRuntimeContribution[];

function normalizeRuntimeContributions(
  runtimeContributions?: AccountRuntimeContributionsInput,
): readonly AccountRuntimeContribution[] {
  if (!runtimeContributions) {
    return [];
  }

  return Array.isArray(runtimeContributions)
    ? Array.from(runtimeContributions)
    : [runtimeContributions as AccountRuntimeContribution];
}

/**
 * Default account runtime contributions owned by the module instance.
 */
export function createAccountRuntimeContributions(
  accountRepository: IAccountRepository,
  runtimeContributions?: AccountRuntimeContributionsInput,
): readonly AccountRuntimeContribution[] {
  return [
    createAccountEventListenerRuntime(accountRepository),
    ...normalizeRuntimeContributions(runtimeContributions),
  ];
}
