/**
 * Message Entity - Client Interface
 * 消息实体 - 客户端接口
 *
 * Residual 807: MessageClientDTO dual retired — sole MessageClientDTOSchema + z.infer.
 */

import type { z } from 'zod';
import { MessageClientDTOSchema } from '../api/response-schemas';

// Residual 807: MessageClientDTO dual retired — OpenAPI + transport use MessageClientDTOSchema.
export type MessageClientDTO = z.infer<typeof MessageClientDTOSchema>;
