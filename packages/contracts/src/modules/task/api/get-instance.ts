import { z } from 'zod';

export const GetInstancesByRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  // 比如是否包含已删除的？
  includeArchived: z.boolean().optional().default(false),
});

export type GetInstancesByRangeReq = z.infer<typeof GetInstancesByRangeSchema>;