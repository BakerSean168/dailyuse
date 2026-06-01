/**
 * Editor runtime contributions for server transports.
 * 编辑器服务端传输层的运行时贡献。
 *
 * This file keeps side effects explicit and reversible.
 * Instead of globally registering initialization tasks via InitializationManager,
 * the editor module now owns its lifecycle through a small runtime object.
 *
 * 这个文件让副作用显式且可逆。
 * editor 不再通过全局 InitializationManager 注册初始化任务，
 * 而是通过一个轻量的 runtime 对象管理自身生命周期。
 */

import { createLogger } from '@dailyuse/utils/logger';
import type { EditorModuleRuntimeContribution } from '../infrastructure-server';

const logger = createLogger('EditorRuntime');

/**
 * Runtime contribution contract used by module transports.
 * 模块传输层使用的运行时贡献契约。
 */
export type EditorRuntimeContribution = EditorModuleRuntimeContribution;

/**
 * Creates an instance-owned runtime contribution.
 * 创建实例级 runtime 贡献对象。
 *
 * Currently performs logging-only startup/shutdown. When the editor gains
 * domain events (e.g. resource:saved, workspace:opened) the event
 * subscriptions will be registered here with start() and torn down with stop().
 *
 * 当前仅执行日志记录的启动/关闭。当编辑器获得领域事件
 * （如 resource:saved, workspace:opened）时，事件订阅将在
 * start() 中注册，并在 stop() 中拆除。
 */
export function createEditorRuntimeContribution(): EditorRuntimeContribution {
  let started = false;

  return {
    start(): void {
      if (started) {
        return;
      }

      started = true;
      logger.info('[Editor] Runtime contribution started');
    },

    stop(): void {
      if (!started) {
        return;
      }

      started = false;
      logger.info('[Editor] Runtime contribution stopped');
    },
  };
}
