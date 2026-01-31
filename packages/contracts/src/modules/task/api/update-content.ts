import { z } from 'zod';

export const UpdateTaskSchema = z.object({
  // 必须传 ID 才能更新
  templateId: z.string().uuid(),
  
  // 允许部分更新 (Partial)
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(), // nullable 允许清空描述
  folderId: z.string().uuid().optional().nullable(),
});

export type UpdateTaskReq = z.infer<typeof UpdateTaskSchema>;