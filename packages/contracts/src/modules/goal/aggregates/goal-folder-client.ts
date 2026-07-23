/**
 * GoalFolder Aggregate Root - Client Interface
 * 目标文件夹聚合根 - 客户端接口
 *
 * Residual 819: GoalFolderClientDTO dual retired — sole GoalFolderClientDTOSchema + z.infer.
 */

import type { z } from 'zod';
import { GoalFolderClientDTOSchema } from '../api/response-schemas';

// Residual 819: GoalFolderClientDTO dual retired — OpenAPI + transport use GoalFolderClientDTOSchema.
export type GoalFolderClientDTO = z.infer<typeof GoalFolderClientDTOSchema>;
