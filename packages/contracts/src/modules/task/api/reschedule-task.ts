import { z } from 'zod';
import { TaskTimeConfigSchema } from './create-task';

export const RescheduleTaskSchema = z.object({
  instanceId: z.string().uuid(), // 注意：拖拽的是 Instance，不是 Template
  
  // 新的时间配置
  newTime: TaskTimeConfigSchema,
  
  // 是否只应用到当前实例，还是应用到后续所有？
  // scope: z.enum(['THIS_INSTANCE', 'FUTURE_INSTANCES']).default('THIS_INSTANCE')
});

export type RescheduleTaskReq = z.infer<typeof RescheduleTaskSchema>;