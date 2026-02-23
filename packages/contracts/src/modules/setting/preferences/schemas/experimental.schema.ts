import { z } from 'zod';

export const ExperimentalSchema = z.object({
  enabled: z.boolean().default(false),
  features: z.array(z.string()).default([]),
});
