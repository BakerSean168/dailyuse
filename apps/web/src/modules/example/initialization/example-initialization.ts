import { InitializationManager, InitializationPhase } from '@dailyuse/utils';

export function registerExampleInitializationTasks() {
  const manager = InitializationManager.getInstance();

  manager.registerTask({
    name: 'example-init',
    phase: InitializationPhase.APP_STARTUP,
    priority: 50,
    initialize: async () => {
      console.log('📦 [ExampleModule] Initialized');
    }
  });
}
