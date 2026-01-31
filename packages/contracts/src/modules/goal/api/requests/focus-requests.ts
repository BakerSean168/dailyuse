/**
 * Focus Requests
 */

/**
 * 开始专注请求
 */
export interface StartFocusRequest {
  goalUuid?: string;
  durationMinutes: number;
  description?: string;
}

/**
 * 停止专注请求
 */
export interface StopFocusRequest {
  notes?: string;
}

/**
 * 查询专注历史请求
 */
export interface GetFocusHistoryRequest {
  goalUuid?: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
  offset?: number;
}
