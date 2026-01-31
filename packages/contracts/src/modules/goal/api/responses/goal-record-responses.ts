/**
 * Goal Record Responses
 */
import type { GoalRecordClientDTO } from '../../aggregates';

/**
 * 目标记录响应
 */
export interface GoalRecordResponse {
  record: GoalRecordClientDTO;
}

/**
 * 目标记录列表响应
 */
export interface GoalRecordsResponse {
  records: GoalRecordClientDTO[];
  total: number;
}
