/**
 * Time Estimation Requests
 */

/**
 * 时间估算请求
 */
export interface TimeEstimationRequest {
  taskId?: string;
  taskTitle: string;
  taskDescription: string;
  complexity?: 'simple' | 'medium' | 'complex';
  dependencies?: string[];
  historicalData?: {
    averageMinutes?: number;
    userSpeedFactor?: number;
    estimationAccuracy?: number;
  };
}
