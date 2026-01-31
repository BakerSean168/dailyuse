import { z } from 'zod';

export const ToggleTaskCompletionSchema = z.object({
  instanceId: z.string().uuid(),
  // 可以加一些元数据，比如完成时的经纬度，或者心情备注
  note: z.string().optional(),
});

export type ToggleTaskCompletionReq = z.infer<typeof ToggleTaskCompletionSchema>;