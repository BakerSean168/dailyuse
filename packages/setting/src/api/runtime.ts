import { createLogger } from '@dailyuse/utils/logger';
import type { SettingModuleRuntimeContribution } from '../infrastructure-server';

const logger = createLogger('SettingRuntime');

export type SettingRuntimeContribution = SettingModuleRuntimeContribution;

/**
 * Small, idempotent runtime owned by the setting module instance.
 * setting 模块实例拥有的小型 runtime；替代旧的全局初始化任务。
 */
export function createSettingRuntimeContribution(): SettingRuntimeContribution {
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
