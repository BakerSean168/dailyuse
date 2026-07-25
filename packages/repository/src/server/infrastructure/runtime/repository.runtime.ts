import { createLogger } from '@dailyuse/utils/logger';
import type { RepositoryModuleRuntimeContribution } from '../repository.module';

const logger = createLogger('RepositoryRuntime');

export function createRepositoryRuntimeContribution(): RepositoryModuleRuntimeContribution {
  let started = false;

  return {
    start(): void {
      if (started) {
        return;
      }

      started = true;
      logger.info('[Repository] Runtime contribution started');
    },

    stop(): void {
      if (!started) {
        return;
      }

      started = false;
      logger.info('[Repository] Runtime contribution stopped');
    },
  };
}
