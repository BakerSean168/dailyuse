/**
 * Editor Module Initialization Tasks
 *
 * Register tasks to execute during application startup.
 */

import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';

const logger = createLogger('EditorInit');

export function registerEditorInitializationTasks(): void {
  const initManager = InitializationManager.getInstance();

  initManager.registerTask({
    name: 'editor-module-startup',
    phase: InitializationPhase.APP_STARTUP,
    priority: 50,
    initialize: async () => {
      logger.info('Editor module initialized');
    },
  });
}
