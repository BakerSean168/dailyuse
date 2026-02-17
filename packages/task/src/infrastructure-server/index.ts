/**
 * Task Module - Infrastructure Server
 *
 * Repository implementations and DI Module for Task module.
 */

// Repositories (from adapters)
export { TaskInstancePrismaRepository } from './adapters/prisma/task-instance-prisma.repository';
export { TaskTemplatePrismaRepository } from './adapters/prisma/task-template-prisma.repository';
export { TaskDependencyPrismaRepository } from './adapters/prisma/task-dependency-prisma.repository';
export { SqliteTaskInstanceRepository } from './adapters/sqlite/task-instance-sqlite.repository';
export { SqliteTaskTemplateRepository } from './adapters/sqlite/task-template-sqlite.repository';
export { SqliteTaskDependencyRepository } from './adapters/sqlite/task-dependency-sqlite.repository';

// DI Module
export { TaskModule } from './task.module';
export { TaskContainer } from './di/task-container';

// SQLite schema
export { TASK_MODULE_SCHEMA } from './adapters/sqlite/schema';

