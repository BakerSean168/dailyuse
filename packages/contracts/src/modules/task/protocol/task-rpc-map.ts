import type {
  CreateTaskTemplateReq,
  CreateTaskTemplateRes,
  UpdateTaskTemplateReq,
  UpdateTaskTemplateRes,
  GetTaskTemplateReq,
  GetTaskTemplateRes,
  QueryTaskTemplatesReq,
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
  CompleteTaskInstanceRes,
  SkipTaskInstanceReq,
  SkipTaskInstanceRes,
  RescheduleTaskReq,
  RescheduleTaskRes,
} from '../api';

export type TaskRpcMap = {
  'task:create-template': [CreateTaskTemplateReq, CreateTaskTemplateRes];
  'task:update-template': [UpdateTaskTemplateReq, UpdateTaskTemplateRes];
  'task:get-template': [GetTaskTemplateReq, GetTaskTemplateRes];
  'task:list-templates': [QueryTaskTemplatesReq, QueryTaskTemplatesRes];
  'task:generate-instances': [GenerateInstancesReq, GenerateInstancesRes];
  'task:bind-goal': [BindToGoalReq, BindToGoalRes];
  'task:unbind-goal': [UnbindFromGoalReq, UnbindFromGoalRes];
  'task:get-instances-by-range': [GetTaskInstancesByRangeReq, GetTaskInstancesByRangeRes];
  'task:complete-instance': [CompleteTaskInstanceReq, CompleteTaskInstanceRes];
  'task:skip-instance': [SkipTaskInstanceReq, SkipTaskInstanceRes];
  'task:reschedule-instance': [RescheduleTaskReq, RescheduleTaskRes];
};