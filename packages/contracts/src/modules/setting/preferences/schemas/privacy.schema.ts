import { z } from 'zod';

export const PrivacySchema = z.object({
  profileVisibility: z.enum(['PUBLIC', 'PRIVATE', 'FRIENDS_ONLY']).default('PRIVATE'),
  showOnlineStatus: z.boolean().default(true),
  shareUsageData: z.boolean().default(false),
  allowSearchByEmail: z.boolean().default(true),
  allowSearchByPhone: z.boolean().default(false),
});
