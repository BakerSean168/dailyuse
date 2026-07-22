import type {
  CreateTaskTemplateReq,
  CreateTaskTemplateRes,
  UpdateTaskTemplateReq,
  UpdateTaskTemplateRes,
  GetTaskTemplateReq,
  GetTaskTemplateRes,
  ListTaskTemplateFilters,
  QueryTaskTemplateGraphRes,
  QueryTaskTemplatesRes,
  GenerateInstancesReq,
  GenerateInstancesRes,
  BindToGoalReq,
  BindToGoalRes,
  UnbindFromGoalReq,
  UnbindFromGoalRes,
  GetTaskInstancesByRangeReq,
  GetTaskInstancesByRangeRes,
  CompleteTaskInstanceReq,
  SkipTaskInstanceReq,
  TaskInstanceOperationRes,
  RescheduleTaskReq,
  RescheduleTaskRes,
} from '../api';

export type TaskRpcMap = {
  'task:create-template': [CreateTaskTemplateReq, CreateTaskTemplateRes];
  'task:update-template': [UpdateTaskTemplateReq, UpdateTaskTemplateRes];
  'task:get-template': [GetTaskTemplateReq, GetTaskTemplateRes];
  'task:list-templates': [ListTaskTemplateFilters, QueryTaskTemplatesRes];
  'task:get-template-graph': [ListTaskTemplateFilters, QueryTaskTemplateGraphRes];
  'task:generate-instances': [GenerateInstancesReq, GenerateInstancesRes];
  'task:bind-goal': [BindToGoalReq, BindToGoalRes];
  'task:unbind-goal': [UnbindFromGoalReq, UnbindFromGoalRes];
  'task:get-instances-by-range': [GetTaskInstancesByRangeReq, GetTaskInstancesByRangeRes];
  'task:complete-instance': [CompleteTaskInstanceReq, TaskInstanceOperationRes];
  'task:skip-instance': [SkipTaskInstanceReq, TaskInstanceOperationRes];
  'task:reschedule-instance': [RescheduleTaskReq, RescheduleTaskRes];
};
