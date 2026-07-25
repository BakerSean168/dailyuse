/**
 * UserSetting Aggregate Root - Client Interface
 *
 * Residual 823: UserSettingClientDTO dual retired — sole UserSettingResponseSchema + z.infer.
 */

import type { z } from 'zod';
import { UserSettingResponseSchema } from '../api/response-schemas';

// Residual 823: UserSettingClientDTO dual retired — OpenAPI + transport use UserSettingResponseSchema.
export type UserSettingClientDTO = z.infer<typeof UserSettingResponseSchema>;
