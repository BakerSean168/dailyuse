import { z } from 'zod';

export const NotificationSchema = z.object({
  email: z.boolean().default(true),
  push: z.boolean().default(true),
  inApp: z.boolean().default(true),
  sound: z.boolean().default(true),
  // Desktop-specific setting for custom notifications
  useCustomNotification: z.boolean().default(true),
});
