import { z } from 'zod';
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
  BindTaskToGoalInvocation,
  CompleteTaskInstanceInvocation,
  CreateTaskDependencyInvocation,
  DeleteTaskDependencyInvocation,
  GenerateInstancesInvocation,
  SkipTaskInstanceInvocation,
  TaskInstanceIdCommandInvocation,
  TaskTemplateIdCommandInvocation,
  UpdateTaskDependencyInvocation,
  UpdateTaskTemplateInvocation,
  ValidateTaskDependencyInvocation,
} from '../api/task-invocation.schemas';
import type {
  GetTaskInstancesByRangeReq,
  GetTaskInstancesByRangeRes,
} from '../api/task-instance.dto';
import type {
  CheckExpiredTaskInstancesResponseSchema,
  TaskDependencyResponseSchema,
  TaskInstanceResponseSchema,
  TaskTemplateResponseSchema,
  ValidateDependencyResponseSchema,
} from '../api/response-schemas';

export type TaskRpcMap = {
  'task:template:create': [CreateTaskTemplateReq, CreateTaskTemplateRes];
  'task:template:update': [
    UpdateTaskTemplateInvocation,
    z.infer<typeof TaskTemplateResponseSchema>,
  ];
  'task:template:delete': [TaskTemplateIdCommandInvocation, null];
  'task:template:restore': [
    TaskTemplateIdCommandInvocation,
    z.infer<typeof TaskTemplateResponseSchema>,
  ];
  'task:template:pause': [
    TaskTemplateIdCommandInvocation,
    z.infer<typeof TaskTemplateResponseSchema>,
  ];
  'task:template:archive': [
    TaskTemplateIdCommandInvocation,
    z.infer<typeof TaskTemplateResponseSchema>,
  ];
  'task:template:generate-instances': [
    GenerateInstancesInvocation,
    z.infer<typeof TaskInstanceResponseSchema>[],
  ];
  'task:template:bind-goal': [BindTaskToGoalInvocation, z.infer<typeof TaskTemplateResponseSchema>];
  'task:template:unbind-goal': [
    TaskTemplateIdCommandInvocation,
    z.infer<typeof TaskTemplateResponseSchema>,
  ];
  'task:template:get': [GetTaskTemplateReq, GetTaskTemplateRes];
  'task:template:list': [ListTaskTemplateFilters, QueryTaskTemplatesRes];
  'task:template:graph': [ListTaskTemplateFilters, QueryTaskTemplateGraphRes];

  'task:instance:create': [
    TaskInstanceIdCommandInvocation,
    z.infer<typeof TaskInstanceResponseSchema>,
  ];
  'task:instance:delete': [TaskInstanceIdCommandInvocation, null];
  'task:instance:complete': [
    CompleteTaskInstanceInvocation,
    z.infer<typeof TaskInstanceResponseSchema>,
  ];
  'task:instance:uncomplete': [
    TaskInstanceIdCommandInvocation,
    z.infer<typeof TaskInstanceResponseSchema>,
  ];
  'task:instance:skip': [SkipTaskInstanceInvocation, z.infer<typeof TaskInstanceResponseSchema>];
  'task:instance:check-expired': [void, z.infer<typeof CheckExpiredTaskInstancesResponseSchema>];
  'task:instance:get-by-date-range': [GetTaskInstancesByRangeReq, GetTaskInstancesByRangeRes];

  'task:dependency:create': [
    CreateTaskDependencyInvocation,
    z.infer<typeof TaskDependencyResponseSchema>,
  ];
  'task:dependency:update': [
    UpdateTaskDependencyInvocation,
    z.infer<typeof TaskDependencyResponseSchema>,
  ];
  'task:dependency:delete': [DeleteTaskDependencyInvocation, null];
  'task:dependency:validate': [
    ValidateTaskDependencyInvocation,
    z.infer<typeof ValidateDependencyResponseSchema>,
  ];

  'task:reschedule-instance': [RescheduleTaskReq, RescheduleTaskRes];
};
