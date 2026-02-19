/**
 * Reminder API Module
 *
 * Self-contained API module entry point, exposed to ApiBootstrapper via register()
 */

export { ReminderApiModule } from './module';
export { registerReminderInitializationTasks } from './initialization';
export type { ReminderApiModuleContext, ReminderApiModuleDef } from './module';