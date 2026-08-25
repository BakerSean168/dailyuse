import type {
  CreateTaskTemplateReq,
  CreateTaskTemplateRes,
  GetTaskTemplateReq,
  GetTaskTemplateRes,
  ListTaskTemplateFilters,
  QueryTaskTemplateGraphRes,
  QueryTaskTemplatesRes,
  RescheduleTaskReq,
  RescheduleTaskRes,
} from '../api';
import type {
  AbandonTaskPlanInvocation,
  BindTaskToGoalInvocation,
  CompleteTaskInstanceInvocation,
  CreateTaskDependencyInvocation,
  DeleteTaskDependencyInvocation,
  GenerateInstancesInvocation,
  MarkTaskInstanceMissedInvocation,
  SkipTaskInstanceInvocation,
  TaskInstanceIdCommandInvocation,
  TaskTemplateIdCommandInvocation,
  UpdateTaskDependencyInvocation,
  UpdateTaskTemplateInvocation,
  ValidateTaskDependencyInvocation,
} from '../api/task-invocation.schemas';
import type { GetTaskInstancesByRangeReq, GetTaskInstancesByRangeRes } from '../api/task-instance.dto';
import type { ValidateDependencyResponse } from '../api/task-dependency.dto';
import type {
  TaskDependencyResponse,
  TaskInstanceResponse,
  TaskTemplateResponse,
} from '../api/response-schemas';

export type TaskRpcMap = {
  'task:template:create': [CreateTaskTemplateReq, CreateTaskTemplateRes];
  'task:template:update': [UpdateTaskTemplateInvocation, TaskTemplateResponse];
  'task:template:delete': [TaskTemplateIdCommandInvocation, null];
  'task:template:activate': [TaskTemplateIdCommandInvocation, TaskTemplateResponse];
  'task:template:abandon': [AbandonTaskPlanInvocation, TaskTemplateResponse];
  'task:template:pause': [TaskTemplateIdCommandInvocation, TaskTemplateResponse];
  'task:template:archive': [TaskTemplateIdCommandInvocation, TaskTemplateResponse];
  'task:template:generate-instances': [GenerateInstancesInvocation, TaskInstanceResponse[]];
  'task:template:bind-goal': [BindTaskToGoalInvocation, TaskTemplateResponse];
  'task:template:unbind-goal': [TaskTemplateIdCommandInvocation, TaskTemplateResponse];
  'task:template:get': [GetTaskTemplateReq, GetTaskTemplateRes];
  'task:template:list': [ListTaskTemplateFilters, QueryTaskTemplatesRes];
  'task:template:graph': [ListTaskTemplateFilters, QueryTaskTemplateGraphRes];

  'task:instance:create': [TaskInstanceIdCommandInvocation, TaskInstanceResponse];
  'task:instance:delete': [TaskInstanceIdCommandInvocation, null];
  'task:instance:complete': [CompleteTaskInstanceInvocation, TaskInstanceResponse];
  'task:instance:uncomplete': [TaskInstanceIdCommandInvocation, TaskInstanceResponse];
  'task:instance:skip': [SkipTaskInstanceInvocation, TaskInstanceResponse];
  'task:instance:mark-missed': [MarkTaskInstanceMissedInvocation, TaskInstanceResponse];
  'task:instance:get-by-date-range': [GetTaskInstancesByRangeReq, GetTaskInstancesByRangeRes];

  'task:dependency:create': [CreateTaskDependencyInvocation, TaskDependencyResponse];
  'task:dependency:update': [UpdateTaskDependencyInvocation, TaskDependencyResponse];
  'task:dependency:delete': [DeleteTaskDependencyInvocation, null];
  'task:dependency:validate': [ValidateTaskDependencyInvocation, ValidateDependencyResponse];

  'task:reschedule-instance': [RescheduleTaskReq, RescheduleTaskRes];
};
