/**
 * Task Module - Infrastructure Server
 *
 * Repository implementations and DI Module for Task module.
 */

// Repositories (from adapters)
export { TaskInstancePrismaRepository } from './adapters/prisma/task-instance-prisma.repository';
export { TaskTemplatePrismaRepository } from './adapters/prisma/task-template-prisma.repository';
export { TaskDependencyPrismaRepository } from './adapters/prisma/task-dependency-prisma.repository';
export { TaskFolderPrismaRepository } from './adapters/prisma/task-folder-prisma.repository';
export { PowerSyncTaskTemplateRepository } from './adapters/powersync/task-template-powersync.repository';
export { PowerSyncTaskInstanceRepository } from './adapters/powersync/task-instance-powersync.repository';
export { PowerSyncTaskDependencyRepository } from './adapters/powersync/task-dependency-powersync.repository';
export { PowerSyncTaskFolderRepository } from './adapters/powersync/task-folder-powersync.repository';

// DI Module
export { TaskModule } from './task.module';
export { TaskPowerSyncModule } from './powersync';
export { TaskContainer } from './di/task-container';
