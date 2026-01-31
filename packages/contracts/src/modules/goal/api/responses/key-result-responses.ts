/**
 * KeyResult Responses
 */

import type { KeyResultServerDTO } from '../../entities';

/**
 * 关键结果响应
 */
export interface KeyResultResponse {
  keyResult: KeyResultServerDTO;
}

/**
 * 关键结果列表响应
 */
export interface KeyResultsResponse {
  keyResults: KeyResultServerDTO[];
  total: number;
}
