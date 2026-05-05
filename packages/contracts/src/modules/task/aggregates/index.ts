/**
 * Task Aggregates Barrel Export
 */

// TaskInstance
export type {
  TaskInstanceServerDTO,
} from './task-instance-server';

export type { TaskInstanceClientDTO } from './task-instance-client';

// TaskTemplate
export type {
  TaskTemplateServerDTO,
} from './task-template-server';

export type {
  TaskTemplateClientDTO,
} from './task-template-client';

export type {
  TaskFolderClientDTO,
} from './task-folder-client';

export type {
  TaskFolderServerDTO,
} from './task-folder-server';

// TaskDependency
export type {
  TaskDependencyServerDTO,
  TaskTemplateWithDependenciesServerDTO,
  CircularDependencyValidationResult,
  DependencyChainServerDTO,
} from './task-dependency-server';

export type {
  TaskDependencyClientDTO,
  TaskTemplateWithDependenciesClientDTO,
  DependencyChainClientDTO,
} from './task-dependency-client';

export { dependencyServerToClientDTO } from './task-dependency-client';
