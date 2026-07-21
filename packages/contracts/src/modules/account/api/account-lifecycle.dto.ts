import { z } from 'zod';

export const CloseAccountSchema = z.object({
  reason: z.string().min(1, '请填写注销原因'),
  feedback: z.string().optional(),
});

export type CloseAccountReq = z.infer<typeof CloseAccountSchema>;
/** Void close success body; transport serializes as `data: null`. */
export type CloseAccountRes = null;
