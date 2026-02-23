import { z } from 'zod';

export const EditorSchema = z.object({
  theme: z.string().default('default'),
  fontSize: z.number().min(8).max(32).default(14),
  tabSize: z.number().min(1).max(8).default(2),
  wordWrap: z.boolean().default(true),
  lineNumbers: z.boolean().default(true),
  minimap: z.boolean().default(true),
});
