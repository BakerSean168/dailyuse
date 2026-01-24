/**
 * Task Module - Infrastructure Server
 *
 * Repository implementations and DI Module for Task module.
 */

// Repositories (from adapters)
export { TaskInstancePrismaRepository } from './adapters/prisma/task-instance-prisma.repository';
// export { TaskTemplatePrismaRepository } from './adapters/prisma/task-template-prisma.repository'; // TODO: Fix and re-enable
export { TaskDependencyPrismaRepository } from './adapters/prisma/task-dependency-prisma.repository';
export { TaskStatisticsPrismaRepository } from './adapters/prisma/task-statistics-prisma.repository';
// export { SqliteTaskInstanceRepository } from './adapters/sqlite/task-instance-sqlite.repository'; // TODO: Fix and re-enable
// export { SqliteTaskTemplateRepository } from './adapters/sqlite/task-template-sqlite.repository'; // TODO: Fix and re-enable
// export { SqliteTaskDependencyRepository } from './adapters/sqlite/task-dependency-sqlite.repository'; // TODO: Fix and re-enable
// export { SqliteTaskStatisticsRepository } from './adapters/sqlite/task-statistics-sqlite.repository'; // TODO: Fix and re-enable

// DI Module
export { TaskModule } from './task.module';

