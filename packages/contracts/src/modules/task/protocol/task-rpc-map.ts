import type {
  CreateTaskTemplateReq,
  CreateTaskTemplateRes,
  GetTaskTemplateReq,
  GetTaskTemplateRes,
  ListTaskTemplateFilters,
  QueryTaskTemplatesRes,
  RescheduleTaskReq,
  RescheduleTaskRes,
} from '../api';
import type {
  AbandonTaskPlanInvocation,
  BindTaskToGoalInvocation,
  CompleteTaskInstanceInvocation,
  GenerateInstancesInvocation,
  MarkTaskInstanceMissedInvocation,
  SkipTaskInstanceInvocation,
  TaskInstanceIdCommandInvocation,
  TaskTemplateIdCommandInvocation,
  UpdateTaskTemplateInvocation,
} from '../api/task-invocation.schemas';
import type { GetTaskInstancesByRangeReq, GetTaskInstancesByRangeRes } from '../api/task-instance.dto';
import type {
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

  'task:instance:create': [TaskInstanceIdCommandInvocation, TaskInstanceResponse];
  'task:instance:delete': [TaskInstanceIdCommandInvocation, null];
  'task:instance:complete': [CompleteTaskInstanceInvocation, TaskInstanceResponse];
  'task:instance:uncomplete': [TaskInstanceIdCommandInvocation, TaskInstanceResponse];
  'task:instance:skip': [SkipTaskInstanceInvocation, TaskInstanceResponse];
  'task:instance:mark-missed': [MarkTaskInstanceMissedInvocation, TaskInstanceResponse];
  'task:instance:get-by-date-range': [GetTaskInstancesByRangeReq, GetTaskInstancesByRangeRes];


  'task:reschedule-instance': [RescheduleTaskReq, RescheduleTaskRes];
};
