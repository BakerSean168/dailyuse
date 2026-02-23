import { z } from 'zod';

export const ShortcutsSchema = z.object({
  enabled: z.boolean().default(true),
  custom: z.record(z.string(), z.string()).default({}),
});
