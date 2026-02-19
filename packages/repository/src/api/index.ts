/**
 * Repository API Module
 *
 * Self-contained API module entry point, exposed to ApiBootstrapper via register()
 */

export { RepositoryApiModule } from './module';
export { registerRepositoryInitializationTasks } from './initialization';
export type { RepositoryApiModuleContext, RepositoryApiModuleDef } from './module';
export type { RepositoryRouteHandlers } from './routes';