import { z } from 'zod';

export const UISchema = z.object({
  startPage: z.string().default('dashboard'),
  sidebarCollapsed: z.boolean().default(false),
});
