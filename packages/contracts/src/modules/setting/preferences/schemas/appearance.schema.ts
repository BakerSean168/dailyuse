import { z } from 'zod';

export const AppearanceSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  fontSize: z.number().min(10).max(24).default(14),
  compactMode: z.boolean().default(false),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
  fontFamily: z.string().nullable().default(null),
});
