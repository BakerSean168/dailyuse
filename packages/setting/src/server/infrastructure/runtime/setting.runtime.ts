import { createLogger } from '@memoflow/utils/logger';
import type { SettingModuleRuntimeContribution } from '../setting.module';

const logger = createLogger('SettingRuntime');

/**
 * Small, idempotent runtime owned by the setting module instance.
 * setting 模块实例拥有的小型 runtime；替代旧的全局初始化任务。
 */
export function createSettingRuntimeContribution(): SettingModuleRuntimeContribution {
  let started = false;

  return {
    start(): void {
      if (started) return;
      started = true;
      logger.info('Setting module runtime started');
    },
    stop(): void {
      if (!started) return;
      started = false;
      logger.info('Setting module runtime stopped');
    },
  };
}
