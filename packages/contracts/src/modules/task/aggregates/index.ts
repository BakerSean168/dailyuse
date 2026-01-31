/**
 * Task Aggregates Barrel Export
 */

// TaskInstance
export type {
  TaskInstanceServerDTO,
  TaskInstancePersistenceDTO,
  TaskInstanceServer,
} from './task-instance-server';

export type { TaskInstanceClientDTO, TaskInstanceClient } from './task-instance-client';

// TaskTemplate
export type {
  TaskTemplateServerDTO,
  TaskTemplatePersistenceDTO,
  TaskTemplateServer,
} from './task-template-server';

export type { 
  TaskTemplateClientDTO, 
  TaskTemplateClient 
} from './task-template-client';

export type {
  TaskFolderClientDTO,
  TaskFolderClient,
} from './task-folder-client';

export type {
  TaskFolderServerDTO,
  TaskFolderPersistenceDTO,
  TaskFolderServer,
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
  CreateTaskDependencyRequest,
  UpdateTaskDependencyRequest,
  ValidateDependencyRequest,
  ValidateDependencyResponse,
  BatchCreateDependenciesRequest,
  BatchCreateDependenciesResponse,
} from './task-dependency-client';
