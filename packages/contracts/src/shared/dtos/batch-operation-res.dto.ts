/**
 * Shared DTOs and types used across multiple modules.
 */

/**
 * 批量操作响应 DTO
 */
export interface BatchOperationResponseDTO<T = string> {
  successCount: number;
  failedCount: number;
  errors?: Array<{
    item: T;
    error: string;
  }>;
}